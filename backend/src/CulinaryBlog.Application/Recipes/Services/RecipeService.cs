using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

public sealed class RecipeService : IRecipeService
{
    // FR-RCP-001: pageSize tối đa 50. FR-RCP-003: title 5–200 ký tự.
    private const int MaxPageSize = 50;
    private const int TitleMinLength = 5;
    private const int TitleMaxLength = 200;

    private static readonly string[] SortOptions =
        ["createdAt", "-createdAt", "title", "-title", "cookTime", "-cookTime"];

    private readonly IRecipeRepository _recipes;
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;

    public RecipeService(IRecipeRepository recipes, ICategoryRepository categories, IUnitOfWork unitOfWork)
    {
        _recipes = recipes;
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<RecipeListItemDto>> GetPagedAsync(
        RecipeQuery query,
        CancellationToken cancellationToken = default)
    {
        ValidateQuery(query);

        // TODO(FR-RCP-001): khi có Auth, Author thấy thêm Draft/Archived của mình, Admin thấy tất cả.
        var result = await _recipes.GetPagedAsync(
            query.Page,
            query.PageSize,
            RecipeStatus.Published,
            query.CategoryId,
            query.Difficulty,
            query.MaxCookTime,
            query.Sort,
            cancellationToken);

        return PagedResult<RecipeListItemDto>.Create(
            result.Items.Select(MapListItem).ToList(),
            result.TotalCount,
            query.Page,
            query.PageSize);
    }

    public async Task<RecipeDetailDto?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var recipe = await _recipes.GetBySlugWithDetailsAsync(slug.Trim(), cancellationToken);
        return recipe is null ? null : MapDetail(recipe);
    }

    public async Task<RecipeDetailDto> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // TODO(FR-RCP-004): chỉ Owner/Admin được mở trang edit khi module Auth hoàn thành.
        var recipe = await _recipes.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw RecipeNotFound(id);
        return MapDetail(recipe);
    }

    public async Task<RecipeDetailDto> CreateAsync(
        CreateRecipeRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCreate(request);

        // TODO(FR-RCP-003): RequireAuthorization (Author/Admin), AuthorId lấy từ JWT.
        var authorId = request.AuthorId!.Trim();
        var errors = new Dictionary<string, string[]>();
        if (await _categories.GetByIdAsync(request.CategoryId, cancellationToken) is null)
            errors["categoryId"] = ["Category không hợp lệ."];
        if (!await _recipes.AuthorExistsAsync(authorId, cancellationToken))
            errors["authorId"] = ["Tác giả không tồn tại."];
        if (errors.Count > 0)
            throw new ValidationException(errors);

        var title = request.Title.Trim();
        var slug = SlugHelper.Generate(title);
        if (await _recipes.SlugExistsAsync(slug, cancellationToken))
            throw new ConflictException(ErrorCodes.RecipeSlugExists, $"Slug '{slug}' đã tồn tại.");

        var recipe = Recipe.Create(
            title,
            slug,
            request.Description.Trim(),
            request.Instructions?.Trim() ?? string.Empty,
            request.CategoryId,
            authorId,
            request.PrepTimeMinutes,
            request.CookTimeMinutes,
            request.Servings,
            request.Difficulty);

        if (request.Nutrition is not null)
            recipe.SetNutrition(MapNutrition(request.Nutrition));

        foreach (var ingredient in request.Ingredients ?? [])
        {
            recipe.AddIngredient(
                ingredient.Name.Trim(),
                ingredient.Quantity,
                RecipeValidation.NullIfBlank(ingredient.Unit),
                RecipeValidation.NullIfBlank(ingredient.Notes),
                ingredient.OrderIndex);
        }

        foreach (var step in request.Steps ?? [])
        {
            recipe.AddStep(
                RecipeValidation.NullIfBlank(step.Title),
                step.Description.Trim(),
                step.TimerMinutes,
                RecipeValidation.NullIfBlank(step.ImageUrl));
        }

        await _recipes.AddAsync(recipe, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // TODO(FR-RCP-003): invalidate Output Cache tag "recipes" khi bật Output Cache.
        // Đọc lại để response có đủ Category/Author như GET /recipes/{slug}.
        var created = await _recipes.GetBySlugWithDetailsAsync(slug, cancellationToken) ?? recipe;
        return MapDetail(created);
    }

    public async Task<RecipeDetailDto> UpdateAsync(
        Guid id,
        UpdateRecipeRequest request,
        string? rowVersion,
        CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string[]>();
        ValidateRecipeFields(
            errors, request.Title, request.Description, request.CategoryId,
            request.PrepTimeMinutes, request.CookTimeMinutes, request.Servings,
            request.Difficulty, request.Nutrition);

        byte[]? expectedVersion = null;
        if (string.IsNullOrWhiteSpace(rowVersion))
            errors["rowVersion"] = ["Thiếu RowVersion (header If-Match hoặc field rowVersion)."];
        else if (!TryDecodeRowVersion(rowVersion, out expectedVersion))
            errors["rowVersion"] = ["RowVersion không hợp lệ."];

        if (errors.Count > 0)
            throw new ValidationException(errors);

        // TODO(FR-RCP-004): resource-based authorization (Owner/Admin, 403) khi module Auth hoàn thành.
        var recipe = await _recipes.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw RecipeNotFound(id);

        // Client đọc bản cũ → từ chối ngay. Trường hợp bị sửa giữa lúc đọc và lúc lưu
        // do EF chặn (RowVersion nằm trong WHERE), UnitOfWork đổi thành cùng lỗi này.
        if (!recipe.RowVersion.AsSpan().SequenceEqual(expectedVersion))
            throw new ConcurrencyConflictException(
                ErrorCodes.RecipeConcurrencyConflict,
                "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại và thử lại.");

        if (request.CategoryId != recipe.CategoryId &&
            await _categories.GetByIdAsync(request.CategoryId, cancellationToken) is null)
            throw new ValidationException("categoryId", "Category không hợp lệ.");

        // Slug chỉ đổi theo title khi còn Draft; recipe đã công khai giữ nguyên URL.
        var title = request.Title.Trim();
        var slug = recipe.Slug;
        if (recipe.Status == RecipeStatus.Draft)
        {
            slug = SlugHelper.Generate(title);
            if (slug != recipe.Slug && await _recipes.SlugExistsAsync(slug, cancellationToken))
                throw new ConflictException(ErrorCodes.RecipeSlugExists, $"Slug '{slug}' đã tồn tại.");
        }

        recipe.Update(
            title,
            slug,
            request.Description.Trim(),
            request.Instructions?.Trim() ?? string.Empty,
            request.CategoryId,
            request.PrepTimeMinutes,
            request.CookTimeMinutes,
            request.Servings,
            request.Difficulty);

        if (request.Nutrition is not null)
            recipe.SetNutrition(MapNutrition(request.Nutrition));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // TODO(FR-RCP-004): EvictByTagAsync("recipes") và $"recipe:{slug}" khi bật Output Cache.
        // Đọc lại để Category khớp với CategoryId mới.
        var updated = await _recipes.GetByIdWithDetailsAsync(id, cancellationToken) ?? recipe;
        return MapDetail(updated);
    }

    public async Task PublishAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var recipe = await _recipes.GetByIdAsync(id, cancellationToken)
            ?? throw RecipeNotFound(id);

        recipe.Publish();
        _recipes.Update(recipe);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateQuery(RecipeQuery query)
    {
        var errors = new Dictionary<string, string[]>();

        if (query.Page < 1)
            errors["page"] = ["page phải >= 1."];
        if (query.PageSize is < 1 or > MaxPageSize)
            errors["pageSize"] = [$"pageSize phải trong khoảng 1–{MaxPageSize}."];
        if (query.Difficulty.HasValue && !Enum.IsDefined(query.Difficulty.Value))
            errors["difficulty"] = ["difficulty không hợp lệ."];
        if (query.MaxCookTime is < 0)
            errors["maxCookTime"] = ["maxCookTime không được âm."];
        if (query.Sort is not null && !SortOptions.Contains(query.Sort))
            errors["sort"] = [$"sort chỉ nhận: {string.Join(", ", SortOptions)}."];

        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    /// <summary>Rule chung cho thông tin cơ bản của recipe khi tạo (FR-RCP-003) và cập nhật (FR-RCP-004).</summary>
    private static void ValidateRecipeFields(
        IDictionary<string, string[]> errors,
        string? title,
        string? description,
        Guid categoryId,
        int prepTimeMinutes,
        int cookTimeMinutes,
        int servings,
        RecipeDifficulty difficulty,
        NutritionRequest? nutrition)
    {
        title = title?.Trim();
        if (string.IsNullOrEmpty(title) || title.Length < TitleMinLength || title.Length > TitleMaxLength)
            errors["title"] = [$"Tiêu đề phải từ {TitleMinLength}–{TitleMaxLength} ký tự."];
        else if (SlugHelper.Generate(title).Length == 0)
            errors["title"] = ["Tiêu đề phải chứa ít nhất một chữ cái hoặc chữ số."];

        if (string.IsNullOrWhiteSpace(description))
            errors["description"] = ["Mô tả là bắt buộc."];
        if (categoryId == Guid.Empty)
            errors["categoryId"] = ["categoryId là bắt buộc."];
        if (prepTimeMinutes <= 0)
            errors["prepTimeMinutes"] = ["Thời gian chuẩn bị phải lớn hơn 0."];
        if (cookTimeMinutes <= 0)
            errors["cookTimeMinutes"] = ["Thời gian nấu phải lớn hơn 0."];
        if (servings <= 0)
            errors["servings"] = ["Khẩu phần phải lớn hơn 0."];
        if (!Enum.IsDefined(difficulty))
            errors["difficulty"] = ["Độ khó không hợp lệ."];

        if (nutrition is { } n &&
            new[] { n.Calories, n.Protein, n.Carbohydrates, n.Fat, n.Fiber, n.Sodium }.Any(v => v < 0))
            errors["nutrition"] = ["Giá trị dinh dưỡng không được âm."];
    }

    private static void ValidateCreate(CreateRecipeRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        ValidateRecipeFields(
            errors, request.Title, request.Description, request.CategoryId,
            request.PrepTimeMinutes, request.CookTimeMinutes, request.Servings,
            request.Difficulty, request.Nutrition);

        if (string.IsNullOrWhiteSpace(request.AuthorId))
            errors["authorId"] = ["authorId là bắt buộc."];

        var ingredients = request.Ingredients ?? [];
        for (var i = 0; i < ingredients.Count; i++)
        {
            var item = ingredients[i];
            RecipeValidation.ValidateIngredient(
                errors, $"ingredients[{i}].", item.Name, item.Quantity, item.Unit, item.Notes, item.OrderIndex);
        }

        var steps = request.Steps ?? [];
        for (var i = 0; i < steps.Count; i++)
        {
            var item = steps[i];
            RecipeValidation.ValidateStep(
                errors, $"steps[{i}].", item.Title, item.Description, item.TimerMinutes, item.ImageUrl);
        }

        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    /// <summary>Nhận cả ETag dạng "abc==" hoặc W/"abc==" lẫn base64 trần.</summary>
    private static bool TryDecodeRowVersion(string value, out byte[] rowVersion)
    {
        var token = value.Trim();
        if (token.StartsWith("W/", StringComparison.Ordinal)) token = token[2..];
        token = token.Trim('"');

        try
        {
            rowVersion = Convert.FromBase64String(token);
            return true;
        }
        catch (FormatException)
        {
            rowVersion = [];
            return false;
        }
    }

    private static NotFoundException RecipeNotFound(Guid id) =>
        new(ErrorCodes.RecipeNotFound, $"Recipe '{id}' không tồn tại.");

    private static RecipeNutrition MapNutrition(NutritionRequest nutrition) => new()
    {
        Calories = nutrition.Calories,
        Protein = nutrition.Protein,
        Carbohydrates = nutrition.Carbohydrates,
        Fat = nutrition.Fat,
        Fiber = nutrition.Fiber,
        Sodium = nutrition.Sodium
    };

    private static RecipeListItemDto MapListItem(Recipe recipe) => new(
        recipe.Id,
        recipe.Title,
        recipe.Slug,
        recipe.Description,
        recipe.PrepTime,
        recipe.CookTime,
        recipe.Servings,
        recipe.Difficulty,
        recipe.Status,
        recipe.CreatedAt,
        recipe.PublishedAt,
        recipe.Images.FirstOrDefault(i => i.IsPrimary)?.OriginalUrl,
        MapCategory(recipe),
        MapAuthor(recipe));

    private static RecipeDetailDto MapDetail(Recipe recipe) => new(
        recipe.Id,
        recipe.Title,
        recipe.Slug,
        recipe.Description,
        recipe.Instructions,
        recipe.PrepTime,
        recipe.CookTime,
        recipe.Servings,
        recipe.Difficulty,
        recipe.Status,
        recipe.PublishedAt,
        MapCategory(recipe),
        MapAuthor(recipe),
        recipe.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.OrderIndex)
            .Select(i => new RecipeImageDto(i.Id, i.OriginalUrl, i.AltText, i.IsPrimary, i.OrderIndex))
            .ToList(),
        new RecipeNutritionDto(
            recipe.Nutrition.Calories,
            recipe.Nutrition.Protein,
            recipe.Nutrition.Carbohydrates,
            recipe.Nutrition.Fat,
            recipe.Nutrition.Fiber,
            recipe.Nutrition.Sodium),
        recipe.Ingredients
            .OrderBy(i => i.OrderIndex)
            .Select(i => new RecipeIngredientDto(i.Id, i.Name, i.Quantity, i.Unit, i.Notes, i.OrderIndex))
            .ToList(),
        recipe.Steps
            .OrderBy(s => s.StepNumber)
            .Select(s => new RecipeStepDto(s.Id, s.StepNumber, s.Title, s.Description, s.TimerMinutes, s.ImageUrl))
            .ToList(),
        Convert.ToBase64String(recipe.RowVersion));

    private static RecipeCategoryDto? MapCategory(Recipe recipe) =>
        recipe.Category is null
            ? null
            : new RecipeCategoryDto(recipe.Category.Id, recipe.Category.Name, recipe.Category.Slug);

    private static RecipeAuthorDto? MapAuthor(Recipe recipe) =>
        recipe.Author is null
            ? null
            : new RecipeAuthorDto(recipe.Author.Id, recipe.Author.DisplayName, recipe.Author.AvatarUrl);
}

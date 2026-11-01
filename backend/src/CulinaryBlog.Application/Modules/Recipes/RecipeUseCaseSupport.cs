using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using RecipeImageDto = CulinaryBlog.Application.Recipes.Models.RecipeImageDto;

namespace CulinaryBlog.Application.Recipes;

/// <summary>
/// Rule và mapping dùng chung cho các Recipe command/query handler.
/// Đây không phải application service: handler vẫn trực tiếp điều phối use case.
/// </summary>
internal static class RecipeUseCaseSupport
{
    private const int MaxPageSize = 50;
    private const int TitleMinLength = 5;
    private const int TitleMaxLength = 200;
    private static readonly string[] SortOptions =
        ["createdAt", "-createdAt", "title", "-title", "cookTime", "-cookTime"];

    public static void ValidateQuery(RecipeQuery query)
    {
        var errors = new Dictionary<string, string[]>();
        if (query.Page < 1) errors["page"] = ["page phải >= 1."];
        if (query.PageSize is < 1 or > MaxPageSize) errors["pageSize"] = [$"pageSize phải trong khoảng 1–{MaxPageSize}."];
        if (query.Difficulty.HasValue && !Enum.IsDefined(query.Difficulty.Value)) errors["difficulty"] = ["difficulty không hợp lệ."];
        if (query.MinPrepTime is < 0) errors["minPrepTime"] = ["minPrepTime không được âm."];
        if (query.MaxCookTime is < 0) errors["maxCookTime"] = ["maxCookTime không được âm."];
        if (query.MinServings is < 0) errors["minServings"] = ["minServings không được âm."];
        if (query.MinPrepTime.HasValue && query.MaxCookTime.HasValue && query.MinPrepTime > query.MaxCookTime)
            errors["minPrepTime"] = ["minPrepTime không được lớn hơn maxCookTime."];
        if (query.Sort is not null && !SortOptions.Contains(query.Sort)) errors["sort"] = [$"sort chỉ nhận: {string.Join(", ", SortOptions)}."];
        if (errors.Count > 0) throw new ValidationException(errors);
    }

    public static void ValidateCreate(CreateRecipeRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        ValidateRecipeFields(errors, request.Title, request.Description, request.CategoryId,
            request.PrepTimeMinutes, request.CookTimeMinutes, request.Servings, request.Difficulty, request.Nutrition);

        foreach (var (item, index) in (request.Ingredients ?? []).Select((item, index) => (item, index)))
            RecipeValidation.ValidateIngredient(errors, $"ingredients[{index}].", item.Name, item.Quantity, item.Unit, item.Notes, item.OrderIndex);
        foreach (var (item, index) in (request.Steps ?? []).Select((item, index) => (item, index)))
            RecipeValidation.ValidateStep(errors, $"steps[{index}].", item.Title, item.Description, item.TimerMinutes, item.ImageUrl);
        if (errors.Count > 0) throw new ValidationException(errors);
    }

    public static byte[] ValidateUpdate(UpdateRecipeRequest request, string? rowVersion)
    {
        var errors = new Dictionary<string, string[]>();
        ValidateRecipeFields(errors, request.Title, request.Description, request.CategoryId,
            request.PrepTimeMinutes, request.CookTimeMinutes, request.Servings, request.Difficulty, request.Nutrition);
        if (string.IsNullOrWhiteSpace(rowVersion)) errors["rowVersion"] = ["Thiếu RowVersion (header If-Match hoặc field rowVersion)."];
        else if (!TryDecodeRowVersion(rowVersion, out var version)) errors["rowVersion"] = ["RowVersion không hợp lệ."];
        if (errors.Count > 0) throw new ValidationException(errors);
        return Convert.FromBase64String(NormalizeRowVersion(rowVersion!));
    }

    public static NotFoundException RecipeNotFound(Guid id) =>
        new(ErrorCodes.RecipeNotFound, $"Recipe '{id}' không tồn tại.");

    public static RecipeNutrition MapNutrition(NutritionRequest nutrition) => new()
    {
        Calories = nutrition.Calories, Protein = nutrition.Protein,
        Carbohydrates = nutrition.Carbohydrates, Fat = nutrition.Fat,
        Fiber = nutrition.Fiber, Sodium = nutrition.Sodium
    };

    public static void ValidateIngredient(string? name, decimal? quantity, string? unit, string? notes, int? orderIndex)
    {
        var errors = new Dictionary<string, string[]>();
        RecipeValidation.ValidateIngredient(errors, string.Empty, name, quantity, unit, notes, orderIndex);
        if (errors.Count > 0) throw new ValidationException(errors);
    }

    public static RecipeIngredientDto MapIngredient(RecipeIngredient ingredient) =>
        new(ingredient.Id, ingredient.Name, ingredient.Quantity, ingredient.Unit, ingredient.Notes, ingredient.OrderIndex);

    public static void ValidateStep(string? title, string? description, int? timerMinutes, string? imageUrl)
    {
        var errors = new Dictionary<string, string[]>();
        RecipeValidation.ValidateStep(errors, string.Empty, title, description, timerMinutes, imageUrl);
        if (errors.Count > 0) throw new ValidationException(errors);
    }

    public static RecipeStepDto MapStep(RecipeStep step) =>
        new(step.Id, step.StepNumber, step.Title, step.Description, step.TimerMinutes, step.ImageUrl);

    public static RecipeListItemDto MapListItem(Recipe recipe) => new(
        recipe.Id, recipe.Title, recipe.Slug, recipe.Description, recipe.PrepTime, recipe.CookTime,
        recipe.Servings, recipe.Difficulty, recipe.Status, recipe.CreatedAt, recipe.PublishedAt,
        recipe.Images.FirstOrDefault(i => i.IsPrimary)?.OriginalUrl,
        recipe.Category is null ? null : new RecipeCategoryDto(recipe.Category.Id, recipe.Category.Name, recipe.Category.Slug),
        recipe.Author is null ? null : new RecipeAuthorDto(recipe.Author.Id, recipe.Author.DisplayName, recipe.Author.AvatarUrl));

    public static RecipeDetailDto MapDetail(Recipe recipe) => new(
        recipe.Id, recipe.Title, recipe.Slug, recipe.Description, recipe.Instructions, recipe.PrepTime,
        recipe.CookTime, recipe.Servings, recipe.Difficulty, recipe.Status, recipe.PublishedAt,
        recipe.Category is null ? null : new RecipeCategoryDto(recipe.Category.Id, recipe.Category.Name, recipe.Category.Slug),
        recipe.Author is null ? null : new RecipeAuthorDto(recipe.Author.Id, recipe.Author.DisplayName, recipe.Author.AvatarUrl),
        recipe.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.OrderIndex)
            .Select(i => new RecipeImageDto(i.Id, i.OriginalUrl, i.MediumUrl, i.ThumbnailUrl, i.AltText, i.IsPrimary, i.OrderIndex)).ToList(),
        new RecipeNutritionDto(recipe.Nutrition.Calories, recipe.Nutrition.Protein, recipe.Nutrition.Carbohydrates,
            recipe.Nutrition.Fat, recipe.Nutrition.Fiber, recipe.Nutrition.Sodium),
        recipe.Ingredients.OrderBy(i => i.OrderIndex)
            .Select(i => new RecipeIngredientDto(i.Id, i.Name, i.Quantity, i.Unit, i.Notes, i.OrderIndex)).ToList(),
        recipe.Steps.OrderBy(s => s.StepNumber)
            .Select(s => new RecipeStepDto(s.Id, s.StepNumber, s.Title, s.Description, s.TimerMinutes, s.ImageUrl)).ToList(),
        Convert.ToBase64String(recipe.RowVersion));

    private static void ValidateRecipeFields(IDictionary<string, string[]> errors, string? title, string? description,
        Guid categoryId, int prepTimeMinutes, int cookTimeMinutes, int servings, RecipeDifficulty difficulty, NutritionRequest? nutrition)
    {
        title = title?.Trim();
        if (string.IsNullOrEmpty(title) || title.Length < TitleMinLength || title.Length > TitleMaxLength) errors["title"] = [$"Tiêu đề phải từ {TitleMinLength}–{TitleMaxLength} ký tự."];
        else if (SlugHelper.Generate(title).Length == 0) errors["title"] = ["Tiêu đề phải chứa ít nhất một chữ cái hoặc chữ số."];
        if (string.IsNullOrWhiteSpace(description)) errors["description"] = ["Mô tả là bắt buộc."];
        if (categoryId == Guid.Empty) errors["categoryId"] = ["categoryId là bắt buộc."];
        if (prepTimeMinutes <= 0) errors["prepTimeMinutes"] = ["Thời gian chuẩn bị phải lớn hơn 0."];
        if (cookTimeMinutes <= 0) errors["cookTimeMinutes"] = ["Thời gian nấu phải lớn hơn 0."];
        if (servings <= 0) errors["servings"] = ["Khẩu phần phải lớn hơn 0."];
        if (!Enum.IsDefined(difficulty)) errors["difficulty"] = ["Độ khó không hợp lệ."];
        if (nutrition is { } n && new[] { n.Calories, n.Protein, n.Carbohydrates, n.Fat, n.Fiber, n.Sodium }.Any(v => v < 0)) errors["nutrition"] = ["Giá trị dinh dưỡng không được âm."];
    }

    private static bool TryDecodeRowVersion(string value, out byte[] rowVersion)
    {
        try { rowVersion = Convert.FromBase64String(NormalizeRowVersion(value)); return true; }
        catch (FormatException) { rowVersion = []; return false; }
    }

    private static string NormalizeRowVersion(string value)
    {
        var token = value.Trim();
        if (token.StartsWith("W/", StringComparison.Ordinal)) token = token[2..];
        return token.Trim('"');
    }
}

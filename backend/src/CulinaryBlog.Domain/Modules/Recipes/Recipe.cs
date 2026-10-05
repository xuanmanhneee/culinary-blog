using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;

namespace CulinaryBlog.Domain.Modules.Recipes;

/// <summary>
/// Aggregate root. Sở hữu RecipeStep, RecipeIngredient, RecipeImage (child entities)
/// và RecipeNutrition (Owned Entity).
/// </summary>
public class Recipe : BaseEntity
{
    public string Title { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public string Instructions { get; private set; } = default!;
    public int PrepTime { get; private set; }
    public int CookTime { get; private set; }
    public int Servings { get; private set; }
    public RecipeDifficulty Difficulty { get; private set; }
    public RecipeStatus Status { get; private set; }
    public DateTimeOffset? PublishedAt { get; private set; }

    public Guid CategoryId { get; private set; }
    public Category? Category { get; private set; }

    public string AuthorId { get; private set; } = default!;
    public ApplicationUser? Author { get; private set; }

    public RecipeNutrition Nutrition { get; private set; } = new();

    private readonly List<RecipeStep> _steps = new();
    public IReadOnlyCollection<RecipeStep> Steps => _steps.AsReadOnly();

    private readonly List<RecipeIngredient> _ingredients = new();
    public IReadOnlyCollection<RecipeIngredient> Ingredients => _ingredients.AsReadOnly();

    private readonly List<RecipeImage> _images = new();
    public IReadOnlyCollection<RecipeImage> Images => _images.AsReadOnly();

    private Recipe() { } // EF Core

    public static Recipe Create(
        string title,
        string slug,
        string description,
        string instructions,
        Guid categoryId,
        string authorId,
        int prepTime,
        int cookTime,
        int servings,
        RecipeDifficulty difficulty,
        RecipeStatus status = RecipeStatus.Draft)
    {
        var recipe = new Recipe
        {
            Title = title,
            Slug = slug,
            Description = description,
            Instructions = instructions,
            CategoryId = categoryId,
            AuthorId = authorId,
            PrepTime = prepTime,
            CookTime = cookTime,
            Servings = servings,
            Difficulty = difficulty,
            Status = status
        };

        if (status == RecipeStatus.Published)
        {
            recipe.PublishedAt = DateTimeOffset.UtcNow;
        }

        return recipe;
    }

    /// <summary>
    /// Cập nhật thông tin cơ bản (FR-RCP-004). Slug do tầng Application sinh và kiểm tra trùng.
    /// </summary>
    public void Update(
        string title,
        string slug,
        string description,
        string instructions,
        Guid categoryId,
        int prepTime,
        int cookTime,
        int servings,
        RecipeDifficulty difficulty)
    {
        Title = title;
        Slug = slug;
        Description = description;
        Instructions = instructions;
        CategoryId = categoryId;
        PrepTime = prepTime;
        CookTime = cookTime;
        Servings = servings;
        Difficulty = difficulty;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetNutrition(RecipeNutrition nutrition) => Nutrition = nutrition;

    /// <summary>
    /// Thêm bước vào cuối danh sách: StepNumber = max + 1 (hoặc 1 nếu chưa có bước nào).
    /// Không có title thì đặt mặc định "Bước {StepNumber}".
    /// </summary>
    public RecipeStep AddStep(string? title, string description, int? timerMinutes = null, string? imageUrl = null)
    {
        var stepNumber = _steps.Count == 0 ? 1 : _steps.Max(s => s.StepNumber) + 1;
        var step = RecipeStep.Create(
            Id, stepNumber, string.IsNullOrWhiteSpace(title) ? RecipeStep.DefaultTitle(stepNumber) : title,
            description, timerMinutes, imageUrl);
        _steps.Add(step);
        return step;
    }

    public RecipeStep? FindStep(Guid stepId) =>
        _steps.FirstOrDefault(s => s.Id == stepId);

    /// <summary>
    /// Xóa bước rồi đánh số lại các bước còn lại để StepNumber liên tục 1, 2, 3... (FR-RCP-010).
    /// </summary>
    public bool RemoveStep(Guid stepId)
    {
        var step = FindStep(stepId);
        if (step is null || !_steps.Remove(step)) return false;

        var number = 1;
        foreach (var remaining in _steps.OrderBy(s => s.StepNumber))
        {
            remaining.Renumber(number++);
        }

        return true;
    }

    /// <summary>
    /// Thêm nguyên liệu. Không truyền orderIndex thì nguyên liệu được xếp cuối danh sách.
    /// </summary>
    public RecipeIngredient AddIngredient(
        string name,
        decimal? quantity,
        string? unit,
        string? notes = null,
        int? orderIndex = null)
    {
        var ingredient = RecipeIngredient.Create(
            Id, name, quantity, unit, orderIndex ?? _ingredients.Count, notes);
        _ingredients.Add(ingredient);
        return ingredient;
    }

    public RecipeIngredient? FindIngredient(Guid ingredientId) =>
        _ingredients.FirstOrDefault(i => i.Id == ingredientId);

    public bool RemoveIngredient(Guid ingredientId)
    {
        var ingredient = FindIngredient(ingredientId);
        return ingredient is not null && _ingredients.Remove(ingredient);
    }

    public void AddImage(string originalUrl, bool isPrimary = false, string? altText = null)
    {
        var orderIndex = _images.Count;
        _images.Add(RecipeImage.Create(Id, originalUrl, isPrimary, orderIndex, altText));
    }

    /// <summary>
    /// Xuất bản (FR-RCP-005). Phải có ít nhất 1 bước thực hiện. Đã Published thì không làm gì (idempotent).
    /// </summary>
    public void Publish()
    {
        if (Status == RecipeStatus.Published) return;

        if (_steps.Count == 0)
            throw new BusinessRuleViolationException(
                ErrorCodes.RecipePublishIncomplete,
                "Recipe must have at least one step before publishing.");

        Status = RecipeStatus.Published;
        PublishedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Hủy xuất bản (FR-RCP-005): đưa về Draft. Cũng dùng để khôi phục recipe đã Archived.
    /// Đã là Draft thì không làm gì (idempotent).
    /// </summary>
    public void Unpublish()
    {
        if (Status == RecipeStatus.Draft) return;

        Status = RecipeStatus.Draft;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Lưu trữ (FR-RCP-006): ẩn khỏi danh sách công khai nhưng giữ dữ liệu. Idempotent.
    /// </summary>
    public void Archive()
    {
        if (Status == RecipeStatus.Archived) return;

        Status = RecipeStatus.Archived;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Models;

/// <summary>
/// FR-RCP-001: một card trong danh sách công thức (RecipeSummaryDto trong SRS).
/// </summary>
public sealed record RecipeListItemDto(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    RecipeDifficulty Difficulty,
    RecipeStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PublishedAt,
    string? PrimaryImageUrl,
    RecipeCategoryDto? Category,
    RecipeAuthorDto? Author);

/// <summary>
/// FR-RCP-002: chi tiết công thức kèm category, author, ảnh, dinh dưỡng, nguyên liệu và các bước.
/// Category/Author là null khi navigation chưa được load (ví dụ response của CreateAsync).
/// </summary>
public sealed record RecipeDetailDto(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    string Instructions,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    RecipeDifficulty Difficulty,
    RecipeStatus Status,
    DateTimeOffset? PublishedAt,
    RecipeCategoryDto? Category,
    RecipeAuthorDto? Author,
    IReadOnlyList<RecipeImageDto> Images,
    RecipeNutritionDto Nutrition,
    IReadOnlyList<RecipeIngredientDto> Ingredients,
    IReadOnlyList<RecipeStepDto> Steps);

public sealed record RecipeCategoryDto(Guid Id, string Name, string Slug);

public sealed record RecipeAuthorDto(string Id, string DisplayName, string? AvatarUrl);

public sealed record RecipeImageDto(Guid Id, string Url, string? AltText, bool IsPrimary, int OrderIndex);

public sealed record RecipeNutritionDto(
    decimal? Calories,
    decimal? Protein,
    decimal? Carbohydrates,
    decimal? Fat,
    decimal? Fiber,
    decimal? Sodium);

public sealed record RecipeIngredientDto(
    Guid Id,
    string Name,
    decimal? Quantity,
    string? Unit,
    string? Notes,
    int OrderIndex);

public sealed record RecipeStepDto(
    Guid Id,
    int StepNumber,
    string Title,
    string Description,
    int? TimerMinutes,
    string? ImageUrl);

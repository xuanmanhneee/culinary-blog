using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Models;

/// <summary>
/// FR-RCP-001: query string của GET /api/v1/recipes.
/// Sort: createdAt | title | cookTime, thêm tiền tố "-" để giảm dần (mặc định "-createdAt").
/// </summary>
public sealed record RecipeQuery(
    int Page = 1,
    int PageSize = 12,
    Guid? CategoryId = null,
    RecipeDifficulty? Difficulty = null,
    int? MaxCookTime = null,
    string? Sort = null);

/// <summary>
/// FR-RCP-003: body của POST /api/v1/recipes. Slug được sinh từ Title, Status luôn là Draft.
/// Steps/Ingredients/Nutrition tùy chọn, có thể thêm sau qua FR-RCP-009/010.
/// </summary>
public sealed record CreateRecipeRequest(
    string Title,
    string Description,
    Guid CategoryId,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    RecipeDifficulty Difficulty,
    string? Instructions = null,
    // TODO(FR-RCP-003): lấy từ JWT (ICurrentUserService) khi module Auth hoàn thành.
    string? AuthorId = null,
    NutritionRequest? Nutrition = null,
    IReadOnlyList<CreateIngredientRequest>? Ingredients = null,
    IReadOnlyList<CreateStepRequest>? Steps = null);

/// <summary>
/// FR-RCP-004: body của PUT /api/v1/recipes/{id}. Nutrition null = giữ nguyên.
/// RowVersion lấy từ header If-Match; RowVersion trong body chỉ dùng khi không có header.
/// </summary>
public sealed record UpdateRecipeRequest(
    string Title,
    string Description,
    Guid CategoryId,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int Servings,
    RecipeDifficulty Difficulty,
    string? Instructions = null,
    NutritionRequest? Nutrition = null,
    string? RowVersion = null);

public sealed record NutritionRequest(
    decimal? Calories = null,
    decimal? Protein = null,
    decimal? Carbohydrates = null,
    decimal? Fat = null,
    decimal? Fiber = null,
    decimal? Sodium = null);

public sealed record CreateIngredientRequest(
    string Name,
    decimal? Quantity,
    string? Unit,
    string? Notes = null,
    int? OrderIndex = null);

public sealed record UpdateIngredientRequest(
    string Name,
    decimal? Quantity,
    string? Unit,
    string? Notes,
    int OrderIndex);

/// <summary>
/// StepNumber do hệ thống tự gán. Title tùy chọn, bỏ trống thì mặc định "Bước {n}".
/// </summary>
public sealed record CreateStepRequest(
    string Description,
    string? Title = null,
    int? TimerMinutes = null,
    string? ImageUrl = null);

/// <summary>
/// FR-RCP-010: cập nhật nội dung bước. StepNumber không đổi qua endpoint này.
/// Title bỏ trống thì giữ title hiện tại.
/// </summary>
public sealed record UpdateStepRequest(
    string Description,
    string? Title = null,
    int? TimerMinutes = null,
    string? ImageUrl = null);

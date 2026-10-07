using CulinaryBlog.Application.Recipes.Models;

namespace CulinaryBlog.Application.Recipes.Services;

/// <summary>
/// FR-RCP-009: Thêm / Cập nhật / Xóa nguyên liệu của một công thức.
/// </summary>
public interface IRecipeIngredientService
{
    Task<RecipeIngredientDto> AddAsync(
        Guid recipeId,
        CreateIngredientRequest request,
        CancellationToken cancellationToken = default);

    Task<RecipeIngredientDto> UpdateAsync(
        Guid recipeId,
        Guid ingredientId,
        UpdateIngredientRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid recipeId,
        Guid ingredientId,
        CancellationToken cancellationToken = default);
}

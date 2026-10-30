using CulinaryBlog.Application.Recipes.Models;

namespace CulinaryBlog.Application.Recipes.Services;

/// <summary>
/// FR-RCP-010: Thêm / Cập nhật / Xóa bước thực hiện của một công thức.
/// StepNumber do hệ thống quản lý: thêm thì nối vào cuối, xóa thì đánh số lại 1, 2, 3...
/// </summary>
public interface IRecipeStepService
{
    Task<RecipeStepDto> AddAsync(
        Guid recipeId,
        CreateStepRequest request,
        CancellationToken cancellationToken = default);

    Task<RecipeStepDto> UpdateAsync(
        Guid recipeId,
        Guid stepId,
        UpdateStepRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid recipeId,
        Guid stepId,
        CancellationToken cancellationToken = default);
}

using CulinaryBlog.Application.Recipes.Models;

namespace CulinaryBlog.Application.Recipes.Services;

/// <summary>
/// FR-RCP-008: Đặt ảnh chính / Xóa ảnh của một công thức.
/// Upload (POST /images) thuộc module File Storage (FR-FILE-001), không nằm ở service này.
/// </summary>
public interface IRecipeImageService
{
    /// <returns>Toàn bộ ảnh của recipe sau khi đổi, ảnh chính đứng đầu.</returns>
    Task<IReadOnlyList<RecipeImageDto>> SetPrimaryAsync(
        Guid recipeId,
        Guid imageId,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid recipeId,
        Guid imageId,
        CancellationToken cancellationToken = default);
}

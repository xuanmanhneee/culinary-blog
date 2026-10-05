using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;

namespace CulinaryBlog.Application.Recipes.Services;

public interface IRecipeService
{
    Task<PagedResult<RecipeListItemDto>> GetPagedAsync(
        RecipeQuery query,
        CancellationToken cancellationToken = default);

    Task<RecipeDetailDto?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default);

    /// <summary>Dùng cho trang edit: id không đổi, còn slug có thể đổi khi recipe là Draft.</summary>
    Task<RecipeDetailDto> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<RecipeDetailDto> CreateAsync(
        CreateRecipeRequest request,
        CancellationToken cancellationToken = default);

    /// <param name="rowVersion">Concurrency token (base64) client đã đọc, từ If-Match hoặc body.</param>
    Task<RecipeDetailDto> UpdateAsync(
        Guid id,
        UpdateRecipeRequest request,
        string? rowVersion,
        CancellationToken cancellationToken = default);

    Task PublishAsync(Guid id, CancellationToken cancellationToken = default);
}

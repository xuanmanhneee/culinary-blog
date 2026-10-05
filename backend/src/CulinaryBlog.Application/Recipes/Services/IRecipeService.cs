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

    /// <summary>FR-RCP-005: Draft/Archived → Published. Cần ít nhất 1 bước; đã Published thì giữ nguyên.</summary>
    Task<RecipeDetailDto> PublishAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>FR-RCP-005: → Draft (cũng dùng để khôi phục recipe Archived). Idempotent.</summary>
    Task<RecipeDetailDto> UnpublishAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>FR-RCP-006: → Archived, ẩn khỏi danh sách công khai nhưng giữ dữ liệu. Idempotent.</summary>
    Task<RecipeDetailDto> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>FR-RCP-007: xóa vĩnh viễn recipe cùng Steps, Ingredients, Images (cascade).</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

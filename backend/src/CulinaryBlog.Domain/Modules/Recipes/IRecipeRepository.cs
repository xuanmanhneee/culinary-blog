using CulinaryBlog.Domain.Common;

namespace CulinaryBlog.Domain.Modules.Recipes;

public interface IRecipeRepository : IRepository<Recipe>
{
    Task<Recipe?> GetBySlugWithDetailsAsync(string slug, CancellationToken cancellationToken = default);

    Task<Recipe?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// FR-RCP-001: danh sách phân trang kèm Category, Author và ảnh chính.
    /// sort: createdAt | title | cookTime, tiền tố "-" là giảm dần; giá trị khác dùng "-createdAt".
    /// </summary>
    Task<(IReadOnlyList<Recipe> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        RecipeStatus? status = null,
        Guid? categoryId = null,
        RecipeDifficulty? difficulty = null,
        int? maxCookTime = null,
        string? sort = null,
        CancellationToken cancellationToken = default);

    Task<Recipe?> GetByIdWithIngredientsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Đánh dấu nguyên liệu mới là Added. Cần thiết vì Id được sinh sẵn ở client:
    /// nếu chỉ thêm vào collection, EF sẽ hiểu nhầm là bản ghi cũ và sinh UPDATE.
    /// </summary>
    void AddIngredient(RecipeIngredient ingredient);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tạm thời: tác giả đang lấy từ body nên phải kiểm tra tồn tại để không vỡ FK.
    /// TODO(Auth): bỏ khi AuthorId lấy từ JWT.
    /// </summary>
    Task<bool> AuthorExistsAsync(string authorId, CancellationToken cancellationToken = default);
}

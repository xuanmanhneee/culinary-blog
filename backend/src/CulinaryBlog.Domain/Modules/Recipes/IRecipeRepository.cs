using CulinaryBlog.Domain.Common;

namespace CulinaryBlog.Domain.Modules.Recipes;

public interface IRecipeRepository : IRepository<Recipe>
{
    Task<Recipe?> GetBySlugWithDetailsAsync(string slug, CancellationToken cancellationToken = default);

    Task<Recipe?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// FR-RCP-001: danh sách phân trang kèm Category, Author và ảnh chính.
    /// sort: createdAt | title | cookTime, tiền tố "-" là giảm dần; giá trị khác dùng "-createdAt".
    /// Hiển thị: includeAllStatuses = true (Admin) lấy mọi trạng thái; ngược lại chỉ Published,
    /// cộng thêm recipe của ownerId (Author xem cả Draft/Archived của mình).
    /// Lọc thêm: authorId (chỉ recipe của tác giả đó), status (sau khi đã áp dụng quyền xem).
    /// </summary>
    Task<(IReadOnlyList<Recipe> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        bool includeAllStatuses = false,
        string? ownerId = null,
        string? authorId = null,
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

    Task<Recipe?> GetByIdWithStepsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Recipe?> GetByIdWithImagesAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Đánh dấu ảnh mới là Added vì entity dùng UUID được sinh trước khi EF theo dõi.</summary>
    void AddImage(RecipeImage image);

    /// <summary>Đánh dấu bước mới là Added, cùng lý do với <see cref="AddIngredient"/>.</summary>
    void AddStep(RecipeStep step);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default);
}

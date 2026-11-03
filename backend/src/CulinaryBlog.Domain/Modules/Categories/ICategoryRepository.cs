using CulinaryBlog.Domain.Common;

namespace CulinaryBlog.Domain.Modules.Categories;

/// <summary>
/// Port (interface) cho module Categories. Application layer chỉ phụ thuộc
/// interface này; Infrastructure implement bằng EF Core.
/// Khi tách microservice sau này, module Categories có thể mang theo
/// interface + entity này sang service riêng mà không đổi hợp đồng.
/// </summary>
public interface ICategoryRepository : IRepository<Category>
{
    Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<bool> NameExistsAsync(string name, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetAllWithRecipeCountAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<Guid, int>> GetRecipeCountsAsync(CancellationToken cancellationToken = default);
    Task<int> CountRecipesInCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
}

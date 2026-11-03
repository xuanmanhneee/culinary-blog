using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Infrastructure.Modules.Categories;

public class CategoryRepository : ICategoryRepository
{
    private readonly CulinaryBlogDbContext _context;

    public CategoryRepository(CulinaryBlogDbContext context) => _context = context;

    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        await _context.Categories.FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);

    public async Task<bool> NameExistsAsync(
        string name,
        Guid? excludingId = null,
        CancellationToken cancellationToken = default) =>
        await _context.Categories.AnyAsync(
            c => c.Name == name && (!excludingId.HasValue || c.Id != excludingId.Value),
            cancellationToken);

    public async Task<IReadOnlyList<Category>> GetAllWithRecipeCountAsync(CancellationToken cancellationToken = default) =>
        await _context.Categories
            .OrderBy(c => c.OrderIndex)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, int>> GetRecipeCountsAsync(CancellationToken cancellationToken = default) =>
        await _context.Recipes
            .GroupBy(r => r.CategoryId)
            .Select(group => new { group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

    public async Task<int> CountRecipesInCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default) =>
        await _context.Recipes.CountAsync(r => r.CategoryId == categoryId, cancellationToken);

    public async Task AddAsync(Category entity, CancellationToken cancellationToken = default) =>
        await _context.Categories.AddAsync(entity, cancellationToken);

    public void Update(Category entity) => _context.Categories.Update(entity);

    public void Remove(Category entity) => _context.Categories.Remove(entity);
}

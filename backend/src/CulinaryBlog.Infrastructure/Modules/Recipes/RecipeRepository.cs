using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public class RecipeRepository : IRecipeRepository
{
    private readonly CulinaryBlogDbContext _context;

    public RecipeRepository(CulinaryBlogDbContext context) => _context = context;

    public async Task<Recipe?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Recipes.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<Recipe?> GetBySlugWithDetailsAsync(string slug, CancellationToken cancellationToken = default) =>
        await _context.Recipes
            .Include(r => r.Steps)
            .Include(r => r.Ingredients)
            .Include(r => r.Images)
            .Include(r => r.Category)
            .Include(r => r.Author)
            .FirstOrDefaultAsync(r => r.Slug == slug, cancellationToken);

    public async Task<(IReadOnlyList<Recipe> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        RecipeStatus? status = null,
        Guid? categoryId = null,
        RecipeDifficulty? difficulty = null,
        int? maxCookTime = null,
        string? sort = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Recipe> query = _context.Recipes.AsNoTracking();

        if (status.HasValue) query = query.Where(r => r.Status == status.Value);
        if (categoryId.HasValue) query = query.Where(r => r.CategoryId == categoryId.Value);
        if (difficulty.HasValue) query = query.Where(r => r.Difficulty == difficulty.Value);
        if (maxCookTime.HasValue) query = query.Where(r => r.CookTime <= maxCookTime.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        IOrderedQueryable<Recipe> ordered = sort switch
        {
            "createdAt" => query.OrderBy(r => r.CreatedAt),
            "title" => query.OrderBy(r => r.Title),
            "-title" => query.OrderByDescending(r => r.Title),
            "cookTime" => query.OrderBy(r => r.CookTime),
            "-cookTime" => query.OrderByDescending(r => r.CookTime),
            _ => query.OrderByDescending(r => r.CreatedAt)
        };

        // Thêm Id để thứ tự ổn định giữa các trang khi giá trị sort trùng nhau.
        var items = await ordered.ThenBy(r => r.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.Category)
            .Include(r => r.Author)
            .Include(r => r.Images.Where(i => i.IsPrimary))
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Recipe?> GetByIdWithIngredientsAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Recipes
            .Include(r => r.Ingredients)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public void AddIngredient(RecipeIngredient ingredient) =>
        _context.Entry(ingredient).State = EntityState.Added;

    public async Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default) =>
        await _context.Recipes.AnyAsync(r => r.Slug == slug, cancellationToken);

    public async Task<bool> AuthorExistsAsync(string authorId, CancellationToken cancellationToken = default) =>
        await _context.Users.AnyAsync(u => u.Id == authorId, cancellationToken);

    public async Task AddAsync(Recipe entity, CancellationToken cancellationToken = default) =>
        await _context.Recipes.AddAsync(entity, cancellationToken);

    public void Update(Recipe entity) => _context.Recipes.Update(entity);

    public void Remove(Recipe entity) => _context.Recipes.Remove(entity);
}

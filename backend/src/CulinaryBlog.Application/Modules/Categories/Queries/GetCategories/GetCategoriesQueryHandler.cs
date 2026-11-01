using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Queries.GetCategories;

internal sealed class GetCategoriesQueryHandler
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly ICategoryRepository _categories;
    private readonly ICacheService _cache;

    public GetCategoriesQueryHandler(ICategoryRepository categories, ICacheService cache) =>
        (_categories, _cache) = (categories, cache);

    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery query, CancellationToken ct)
    {
        var cached = await _cache.GetAsync<List<CategoryDto>>("categories:all", ct);
        if (cached is not null) return cached;

        var categories = await _categories.GetAllWithRecipeCountAsync(ct);
        var counts = await _categories.GetRecipeCountsAsync(ct);
        var result = categories
            .Select(category => CategoryMappings.ToDto(category, counts.GetValueOrDefault(category.Id)))
            .ToList();
        await _cache.SetAsync("categories:all", result, TimeSpan.FromMinutes(10), "categories", ct);
        return result;
    }
}

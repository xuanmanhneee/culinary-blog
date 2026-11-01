using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Queries.GetCategoryBySlug;

internal sealed class GetCategoryBySlugQueryHandler
    : IRequestHandler<GetCategoryBySlugQuery, CategoryDto?>
{
    private readonly ICategoryRepository _categories;
    private readonly ICacheService _cache;

    public GetCategoryBySlugQueryHandler(ICategoryRepository categories, ICacheService cache) =>
        (_categories, _cache) = (categories, cache);

    public async Task<CategoryDto?> Handle(GetCategoryBySlugQuery query, CancellationToken ct)
    {
        var slug = query.Slug.Trim().ToLowerInvariant();
        var cached = await _cache.GetAsync<CategoryDto>($"category:slug:{slug}", ct);
        if (cached is not null) return cached;

        var category = await _categories.GetBySlugAsync(slug, ct);
        if (category is null) return null;

        var result = CategoryMappings.ToDto(category);
        await _cache.SetAsync($"category:slug:{slug}", result, TimeSpan.FromMinutes(10), "categories", ct);
        return result;
    }
}

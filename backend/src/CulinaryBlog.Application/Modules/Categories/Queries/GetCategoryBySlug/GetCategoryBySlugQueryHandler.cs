using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Queries.GetCategoryBySlug;

internal sealed class GetCategoryBySlugQueryHandler
    : IRequestHandler<GetCategoryBySlugQuery, CategoryDto?>
{
    private readonly ICategoryRepository _categories;

    public GetCategoryBySlugQueryHandler(ICategoryRepository categories) => _categories = categories;

    public async Task<CategoryDto?> Handle(GetCategoryBySlugQuery query, CancellationToken ct)
    {
        var category = await _categories.GetBySlugAsync(query.Slug.Trim(), ct);
        return category is null ? null : CategoryMappings.ToDto(category);
    }
}

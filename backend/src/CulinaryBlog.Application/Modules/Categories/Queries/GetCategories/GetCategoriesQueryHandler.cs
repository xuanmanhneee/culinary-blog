using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Queries.GetCategories;

internal sealed class GetCategoriesQueryHandler
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly ICategoryRepository _categories;

    public GetCategoriesQueryHandler(ICategoryRepository categories) => _categories = categories;

    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery query, CancellationToken ct) =>
        (await _categories.GetAllWithRecipeCountAsync(ct)).Select(CategoryMappings.ToDto).ToList();
}

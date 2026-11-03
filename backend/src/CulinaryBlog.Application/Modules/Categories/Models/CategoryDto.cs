namespace CulinaryBlog.Application.Categories.Models;

public sealed record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    int OrderIndex,
    int RecipeCount = 0);

public sealed record CategoryDetailDto(
    CategoryDto Category,
    CulinaryBlog.Application.Common.Models.PagedResult<CulinaryBlog.Application.Recipes.Models.RecipeListItemDto> Recipes);

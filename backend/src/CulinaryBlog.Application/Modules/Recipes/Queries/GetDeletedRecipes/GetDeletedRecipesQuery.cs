using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetDeletedRecipes;

public sealed record GetDeletedRecipesQuery(int Page = 1, int PageSize = 12)
    : IRequest<PagedResult<RecipeListItemDto>>;

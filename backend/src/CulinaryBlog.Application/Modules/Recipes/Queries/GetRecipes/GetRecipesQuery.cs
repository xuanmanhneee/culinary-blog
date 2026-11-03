using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetRecipes;

public sealed record GetRecipesQuery(RecipeQuery Request)
    : IRequest<PagedResult<RecipeListItemDto>>;

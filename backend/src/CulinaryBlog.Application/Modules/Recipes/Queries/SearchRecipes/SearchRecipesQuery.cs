using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public record SearchRecipesQuery(
    string SearchTerm,
    int Page = 1,
    int PageSize = 10,
    Guid? CategoryId = null,
    RecipeDifficulty? Difficulty = null,
    int? MaxCookTime = null,
    int? MinServings = null)
    : IRequest<PagedResult<RecipeSummaryDto>>;


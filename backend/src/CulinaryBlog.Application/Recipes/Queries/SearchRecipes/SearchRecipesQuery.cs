using CulinaryBlog.Application.Common.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public record SearchRecipesQuery(string SearchTerm, int Page = 1, int PageSize = 10) : IRequest<PagedResult<RecipeSummaryDto>>;


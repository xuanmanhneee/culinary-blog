using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetSavedRecipes;

public sealed record GetSavedRecipesQuery(int Page = 1, int PageSize = 10) : IRequest<PagedResult<RecipeListItemDto>>;

internal sealed class GetSavedRecipesQueryHandler : IRequestHandler<GetSavedRecipesQuery, PagedResult<RecipeListItemDto>>
{
    private readonly IRecipeRepository _recipes;
    private readonly ICurrentUserService _currentUser;

    public GetSavedRecipesQueryHandler(IRecipeRepository recipes, ICurrentUserService currentUser)
    {
        _recipes = recipes;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<RecipeListItemDto>> Handle(GetSavedRecipesQuery query, CancellationToken ct)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedException(ErrorCodes.AuthUnauthorized, "Bạn cần đăng nhập.");
        }

        var (items, totalCount) = await _recipes.GetFavoritesPagedAsync(
            _currentUser.UserId, query.Page, query.PageSize, ct);

        return PagedResult<RecipeListItemDto>.Create(
            items.Select(RecipeUseCaseSupport.MapListItem).ToList(),
            totalCount,
            query.Page,
            query.PageSize);
    }
}

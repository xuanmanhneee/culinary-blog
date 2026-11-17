using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetFavoriteStatus;

public sealed record GetFavoriteStatusQuery(Guid RecipeId) : IRequest<bool>;

internal sealed class GetFavoriteStatusQueryHandler : IRequestHandler<GetFavoriteStatusQuery, bool>
{
    private readonly IRecipeRepository _recipes;
    private readonly ICurrentUserService _currentUser;

    public GetFavoriteStatusQueryHandler(IRecipeRepository recipes, ICurrentUserService currentUser)
    {
        _recipes = recipes;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(GetFavoriteStatusQuery query, CancellationToken ct)
    {
        if (_currentUser.UserId is null) return false;
        return await _recipes.IsFavoriteAsync(query.RecipeId, _currentUser.UserId, ct);
    }
}

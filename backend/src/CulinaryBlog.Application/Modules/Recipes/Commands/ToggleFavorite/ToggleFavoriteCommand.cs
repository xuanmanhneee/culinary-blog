using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.ToggleFavorite;

public sealed record ToggleFavoriteCommand(Guid RecipeId) : IRequest<bool>;

internal sealed class ToggleFavoriteCommandHandler : IRequestHandler<ToggleFavoriteCommand, bool>
{
    private readonly IRecipeRepository _recipes;
    private readonly ICurrentUserService _currentUser;

    public ToggleFavoriteCommandHandler(IRecipeRepository recipes, ICurrentUserService currentUser)
    {
        _recipes = recipes;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(ToggleFavoriteCommand command, CancellationToken ct)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedException(ErrorCodes.AuthUnauthorized, "Bạn cần đăng nhập để lưu công thức.");
        }

        var recipe = await _recipes.GetByIdAsync(command.RecipeId, ct);
        if (recipe is null)
        {
            throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Không tìm thấy công thức '{command.RecipeId}'.");
        }

        return await _recipes.ToggleFavoriteAsync(command.RecipeId, _currentUser.UserId, ct);
    }
}

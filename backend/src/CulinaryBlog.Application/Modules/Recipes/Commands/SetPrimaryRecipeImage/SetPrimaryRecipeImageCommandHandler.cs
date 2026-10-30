using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.SetPrimaryRecipeImage;

internal sealed class SetPrimaryRecipeImageCommandHandler
    : IRequestHandler<SetPrimaryRecipeImageCommand, IReadOnlyList<RecipeImageDto>>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public SetPrimaryRecipeImageCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<IReadOnlyList<RecipeImageDto>> Handle(
        SetPrimaryRecipeImageCommand command,
        CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);

        if (!recipe.SetPrimaryImage(command.ImageId))
            throw new NotFoundException(ErrorCodes.ImageNotFound, $"Image '{command.ImageId}' không tồn tại.");

        await _unitOfWork.SaveChangesAsync(ct);
        return recipe.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.OrderIndex)
            .Select(i => new RecipeImageDto(i.Id, i.OriginalUrl, i.AltText, i.IsPrimary, i.OrderIndex))
            .ToList();
    }
}

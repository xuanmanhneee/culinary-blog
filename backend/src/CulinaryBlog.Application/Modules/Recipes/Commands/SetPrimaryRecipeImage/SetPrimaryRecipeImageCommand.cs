using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.SetPrimaryRecipeImage;

public sealed record SetPrimaryRecipeImageCommand(Guid RecipeId, Guid ImageId)
    : IRequest<IReadOnlyList<RecipeImageDto>>;

using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeImage;

public sealed record UpdateRecipeImageCommand(
    Guid RecipeId,
    Guid ImageId,
    UpdateRecipeImageRequest Request) : IRequest<RecipeImageDto>;

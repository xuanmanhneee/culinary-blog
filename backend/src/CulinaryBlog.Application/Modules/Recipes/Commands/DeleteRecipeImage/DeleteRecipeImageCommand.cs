using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipeImage;

public sealed record DeleteRecipeImageCommand(Guid RecipeId, Guid ImageId) : IRequest;

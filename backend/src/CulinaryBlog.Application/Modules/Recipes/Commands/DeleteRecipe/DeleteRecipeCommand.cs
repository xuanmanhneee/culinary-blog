using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipe;

public sealed record DeleteRecipeCommand(Guid RecipeId) : IRequest;

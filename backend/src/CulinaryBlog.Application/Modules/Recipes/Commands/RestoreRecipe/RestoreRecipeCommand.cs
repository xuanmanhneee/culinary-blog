using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.RestoreRecipe;

public sealed record RestoreRecipeCommand(Guid RecipeId) : IRequest;

using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipeIngredient;

public sealed record DeleteRecipeIngredientCommand(Guid RecipeId, Guid IngredientId) : IRequest;

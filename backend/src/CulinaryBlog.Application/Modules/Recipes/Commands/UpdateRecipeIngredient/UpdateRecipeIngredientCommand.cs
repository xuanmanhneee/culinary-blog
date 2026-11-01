using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeIngredient;

public sealed record UpdateRecipeIngredientCommand(Guid RecipeId, Guid IngredientId, UpdateIngredientRequest Request)
    : IRequest<RecipeIngredientDto>;

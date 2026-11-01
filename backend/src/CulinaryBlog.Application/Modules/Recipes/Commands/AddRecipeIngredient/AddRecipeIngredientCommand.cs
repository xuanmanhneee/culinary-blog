using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.AddRecipeIngredient;

public sealed record AddRecipeIngredientCommand(Guid RecipeId, CreateIngredientRequest Request)
    : IRequest<RecipeIngredientDto>;

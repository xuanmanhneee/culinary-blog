using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipe;

public sealed record UpdateRecipeCommand(
    Guid RecipeId,
    UpdateRecipeRequest Request,
    string? RowVersion) : IRequest<RecipeDetailDto>;

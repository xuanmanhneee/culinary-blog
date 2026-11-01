using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.CreateRecipe;

public sealed record CreateRecipeCommand(CreateRecipeRequest Request)
    : IRequest<RecipeDetailDto>;

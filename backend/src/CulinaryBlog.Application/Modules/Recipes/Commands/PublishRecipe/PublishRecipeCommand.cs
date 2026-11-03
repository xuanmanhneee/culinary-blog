using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.PublishRecipe;

public sealed record PublishRecipeCommand(Guid RecipeId) : IRequest<RecipeDetailDto>;

using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UnpublishRecipe;

public sealed record UnpublishRecipeCommand(Guid RecipeId) : IRequest<RecipeDetailDto>;

using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.ArchiveRecipe;

public sealed record ArchiveRecipeCommand(Guid RecipeId) : IRequest<RecipeDetailDto>;

using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.AddRecipeStep;

public sealed record AddRecipeStepCommand(Guid RecipeId, CreateStepRequest Request) : IRequest<RecipeStepDto>;

using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeStep;

public sealed record UpdateRecipeStepCommand(Guid RecipeId, Guid StepId, UpdateStepRequest Request) : IRequest<RecipeStepDto>;

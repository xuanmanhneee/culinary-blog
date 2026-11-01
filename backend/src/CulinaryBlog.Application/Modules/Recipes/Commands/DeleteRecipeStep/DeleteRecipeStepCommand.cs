using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipeStep;

public sealed record DeleteRecipeStepCommand(Guid RecipeId, Guid StepId) : IRequest;

using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetRecipeById;

public sealed record GetRecipeByIdQuery(Guid RecipeId) : IRequest<RecipeDetailDto>;

using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;

namespace CulinaryBlog.API.Endpoints;

/// <summary>
/// FR-RCP-009: /api/v1/recipes/{recipeId}/ingredients
/// </summary>
public static class RecipeIngredientEndpoints
{
    public static IEndpointRouteBuilder MapRecipeIngredientEndpoints(this IEndpointRouteBuilder app)
    {
        // TODO(FR-RCP-009): RequireAuthorization (Owner/Admin) khi module Auth hoàn thành.
        var group = app.MapGroup("/api/v1/recipes/{recipeId:guid}/ingredients")
            .WithTags("Recipe Ingredients");

        group.MapPost("/", AddAsync);
        group.MapPut("/{ingredientId:guid}", UpdateAsync);
        group.MapDelete("/{ingredientId:guid}", DeleteAsync);

        return app;
    }

    private static async Task<IResult> AddAsync(
        Guid recipeId,
        CreateIngredientRequest request,
        IRecipeIngredientService service,
        CancellationToken cancellationToken)
    {
        var ingredient = await service.AddAsync(recipeId, request, cancellationToken);
        return Results.Created(
            $"/api/v1/recipes/{recipeId}/ingredients/{ingredient.Id}",
            ingredient);
    }

    private static async Task<IResult> UpdateAsync(
        Guid recipeId,
        Guid ingredientId,
        UpdateIngredientRequest request,
        IRecipeIngredientService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.UpdateAsync(recipeId, ingredientId, request, cancellationToken));

    private static async Task<IResult> DeleteAsync(
        Guid recipeId,
        Guid ingredientId,
        IRecipeIngredientService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(recipeId, ingredientId, cancellationToken);
        return Results.NoContent();
    }
}

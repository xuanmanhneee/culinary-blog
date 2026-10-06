using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;

namespace CulinaryBlog.API.Endpoints;

/// <summary>
/// FR-RCP-010: /api/v1/recipes/{recipeId}/steps
/// </summary>
public static class RecipeStepEndpoints
{
    public static IEndpointRouteBuilder MapRecipeStepEndpoints(this IEndpointRouteBuilder app)
    {
        // TODO(FR-RCP-010): RequireAuthorization (Owner/Admin) khi module Auth hoàn thành.
        var group = app.MapGroup("/api/v1/recipes/{recipeId:guid}/steps")
            .WithTags("Recipe Steps");

        group.MapPost("/", AddAsync);
        group.MapPut("/{stepId:guid}", UpdateAsync);
        group.MapDelete("/{stepId:guid}", DeleteAsync);

        return app;
    }

    private static async Task<IResult> AddAsync(
        Guid recipeId,
        CreateStepRequest request,
        IRecipeStepService service,
        CancellationToken cancellationToken)
    {
        var step = await service.AddAsync(recipeId, request, cancellationToken);
        return Results.Created(
            $"/api/v1/recipes/{recipeId}/steps/{step.Id}",
            step);
    }

    private static async Task<IResult> UpdateAsync(
        Guid recipeId,
        Guid stepId,
        UpdateStepRequest request,
        IRecipeStepService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.UpdateAsync(recipeId, stepId, request, cancellationToken));

    private static async Task<IResult> DeleteAsync(
        Guid recipeId,
        Guid stepId,
        IRecipeStepService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(recipeId, stepId, cancellationToken);
        return Results.NoContent();
    }
}

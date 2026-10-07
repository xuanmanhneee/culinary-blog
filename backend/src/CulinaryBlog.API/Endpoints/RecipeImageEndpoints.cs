using CulinaryBlog.Application.Recipes.Services;

namespace CulinaryBlog.API.Endpoints;

/// <summary>
/// FR-RCP-008: /api/v1/recipes/{recipeId}/images/{imageId}
/// PATCH .../primary (đặt ảnh chính), DELETE (xóa ảnh).
/// Upload POST /api/v1/recipes/{id}/images nằm ở module File Storage (FR-FILE-001).
/// </summary>
public static class RecipeImageEndpoints
{
    public static IEndpointRouteBuilder MapRecipeImageEndpoints(this IEndpointRouteBuilder app)
    {
        // TODO(FR-RCP-008): RequireAuthorization (Owner/Admin) khi module Auth hoàn thành.
        var group = app.MapGroup("/api/v1/recipes/{recipeId:guid}/images")
            .WithTags("Recipe Images");

        group.MapPatch("/{imageId:guid}/primary", SetPrimaryAsync);
        group.MapDelete("/{imageId:guid}", DeleteAsync);

        return app;
    }

    private static async Task<IResult> SetPrimaryAsync(
        Guid recipeId,
        Guid imageId,
        IRecipeImageService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.SetPrimaryAsync(recipeId, imageId, cancellationToken));

    private static async Task<IResult> DeleteAsync(
        Guid recipeId,
        Guid imageId,
        IRecipeImageService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(recipeId, imageId, cancellationToken);
        return Results.NoContent();
    }
}

using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;

namespace CulinaryBlog.API.Endpoints;

/// <summary>
/// FR-RCP-001: GET /api/v1/recipes
/// FR-RCP-002: GET /api/v1/recipes/{slug}
/// FR-RCP-003: POST /api/v1/recipes
/// </summary>
public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/recipes")
            .WithTags("Recipes");

        group.MapGet("/", GetPagedAsync);
        group.MapGet("/{slug}", GetBySlugAsync);
        // TODO(FR-RCP-003): RequireAuthorization (Author/Admin) khi module Auth hoàn thành.
        group.MapPost("/", CreateAsync);

        return app;
    }

    private static async Task<IResult> GetPagedAsync(
        [AsParameters] RecipeQuery query,
        IRecipeService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.GetPagedAsync(query, cancellationToken));

    private static async Task<IResult> GetBySlugAsync(
        string slug,
        IRecipeService service,
        CancellationToken cancellationToken)
    {
        var recipe = await service.GetBySlugAsync(slug, cancellationToken);
        if (recipe is null)
        {
            return Results.Problem(
                detail: $"Recipe with slug '{slug}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // TODO(FR-RCP-002): Draft/Archived chỉ cho Owner/Admin xem (403) khi module Auth hoàn thành.
        return Results.Ok(recipe);
    }

    private static async Task<IResult> CreateAsync(
        CreateRecipeRequest request,
        IRecipeService service,
        CancellationToken cancellationToken)
    {
        var recipe = await service.CreateAsync(request, cancellationToken);
        return Results.Created($"/api/v1/recipes/{recipe.Slug}", recipe);
    }
}

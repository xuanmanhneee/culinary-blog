using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;
using CulinaryBlog.Application.Recipes.Queries.SearchRecipes;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

/// <summary>
/// FR-RCP-001: GET /api/v1/recipes
/// FR-RCP-002: GET /api/v1/recipes/{slug}
/// FR-RCP-003: POST /api/v1/recipes
/// FR-SEARCH-001: GET /api/v1/recipes/search?q={query}
/// FR-FILE-001: POST /api/v1/recipes/{id}/images
/// FR-RCP-004: GET /api/v1/recipes/{id:guid} (trang edit, trả ETag), PUT /api/v1/recipes/{id:guid} (If-Match)
/// FR-RCP-005: PATCH /api/v1/recipes/{id:guid}/publish | /unpublish
/// FR-RCP-006: PATCH /api/v1/recipes/{id:guid}/archive
/// FR-RCP-007: DELETE /api/v1/recipes/{id:guid}
/// </summary>
public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/recipes")
            .WithTags("Recipes");

        group.MapGet("/", GetPagedAsync);
        group.MapGet("/search", SearchAsync);
        group.MapPost("/{id:guid}/images", UploadImageAsync)
            .Accepts<IFormFile>("multipart/form-data")
            .DisableAntiforgery();
        // {id:guid} khai báo riêng để không bị route {slug} bắt mất.
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapGet("/{slug}", GetBySlugAsync);
        // TODO(FR-RCP-003/004): RequireAuthorization (Author/Admin, Owner) khi module Auth hoàn thành.
        group.MapPost("/", CreateAsync);
        group.MapPut("/{id:guid}", UpdateAsync);
        group.MapPatch("/{id:guid}/publish", PublishAsync);
        group.MapPatch("/{id:guid}/unpublish", UnpublishAsync);
        group.MapPatch("/{id:guid}/archive", ArchiveAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);

        return app;
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        IRecipeService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> SearchAsync(
        [FromQuery(Name = "q")] string? q,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new SearchRecipesQuery(q ?? string.Empty, page ?? 1, pageSize ?? 10),
            cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> UploadImageAsync(
        Guid id,
        [FromForm(Name = "file")] IFormFile file,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new UploadRecipeImageCommand(id, file), cancellationToken);
        return Results.Created($"/api/v1/recipes/{id}/images/{result.Id}", result);
    }

    private static async Task<IResult> PublishAsync(
        Guid id,
        IRecipeService service,
        HttpContext httpContext,
        CancellationToken cancellationToken) =>
        StatusChanged(httpContext, await service.PublishAsync(id, cancellationToken));

    private static async Task<IResult> UnpublishAsync(
        Guid id,
        IRecipeService service,
        HttpContext httpContext,
        CancellationToken cancellationToken) =>
        StatusChanged(httpContext, await service.UnpublishAsync(id, cancellationToken));

    private static async Task<IResult> ArchiveAsync(
        Guid id,
        IRecipeService service,
        HttpContext httpContext,
        CancellationToken cancellationToken) =>
        StatusChanged(httpContext, await service.ArchiveAsync(id, cancellationToken));

    private static IResult StatusChanged(HttpContext httpContext, RecipeDetailDto recipe)
    {
        SetETag(httpContext, recipe);
        return Results.Ok(recipe);
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        IRecipeService service,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var recipe = await service.GetByIdAsync(id, cancellationToken);
        SetETag(httpContext, recipe);
        return Results.Ok(recipe);
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateRecipeRequest request,
        IRecipeService service,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        // If-Match (ETag pattern) ưu tiên hơn rowVersion trong body.
        var ifMatch = httpContext.Request.Headers.IfMatch.ToString();
        var rowVersion = string.IsNullOrWhiteSpace(ifMatch) ? request.RowVersion : ifMatch;

        var recipe = await service.UpdateAsync(id, request, rowVersion, cancellationToken);
        SetETag(httpContext, recipe);
        return Results.Ok(recipe);
    }

    private static void SetETag(HttpContext httpContext, RecipeDetailDto recipe) =>
        httpContext.Response.Headers.ETag = $"\"{recipe.RowVersion}\"";

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
            throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe with slug '{slug}' was not found.");
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

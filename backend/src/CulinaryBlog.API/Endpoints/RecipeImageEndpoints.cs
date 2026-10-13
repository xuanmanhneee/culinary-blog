using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Recipes.Models;
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
        // Role Author/Admin tại endpoint; owner/Admin trên từng recipe do RecipeAuthorizationHandler kiểm tra.
        var group = app.MapGroup("/api/v1/recipes/{recipeId:guid}/images")
            .WithTags("Recipe Images")
            .RequireAuthorization(AuthServiceCollectionExtensions.AuthorPolicy)
            .ProducesAuthProblems()
            .ProducesNotFoundProblem();

        group.MapPatch("/{imageId:guid}/primary", SetPrimaryAsync)
            .WithName("SetPrimaryRecipeImage")
            .WithSummary("Đặt ảnh chính")
            .WithDescription("FR-RCP-008. Trả toàn bộ ảnh của recipe, ảnh chính đứng đầu. Ảnh không tồn tại: 404 IMAGE_NOT_FOUND.")
            .Produces<IReadOnlyList<RecipeImageDto>>();

        group.MapDelete("/{imageId:guid}", DeleteAsync)
            .WithName("DeleteRecipeImage")
            .WithSummary("Xóa ảnh")
            .WithDescription("FR-RCP-008. Xóa ảnh chính thì ảnh đầu tiên còn lại trở thành ảnh chính.")
            .Produces(StatusCodes.Status204NoContent);

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

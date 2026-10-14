using CulinaryBlog.API.Extensions;
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
        // Role Author/Admin tại endpoint; owner/Admin trên từng recipe do RecipeAuthorizationHandler kiểm tra.
        var group = app.MapVersionedApiGroup("RecipeSteps", "recipes/{recipeId:guid}/steps")
            .WithTags("Recipe Steps")
            .RequireAuthorization(AuthServiceCollectionExtensions.AuthorPolicy)
            .ProducesAuthProblems()
            .ProducesNotFoundProblem();

        group.MapPost("/", AddAsync)
            .WithName("AddRecipeStep")
            .WithSummary("Thêm bước thực hiện")
            .WithDescription("FR-RCP-010. StepNumber tự tăng (nối vào cuối); title trống thì mặc định \"Bước n\".")
            .Produces<RecipeStepDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapPut("/{stepId:guid}", UpdateAsync)
            .WithName("UpdateRecipeStep")
            .WithSummary("Cập nhật bước thực hiện")
            .WithDescription("FR-RCP-010. StepNumber không đổi; title trống thì giữ title hiện tại. Bước không tồn tại: 404 STEP_NOT_FOUND.")
            .Produces<RecipeStepDto>()
            .ProducesValidationProblem();

        group.MapDelete("/{stepId:guid}", DeleteAsync)
            .WithName("DeleteRecipeStep")
            .WithSummary("Xóa bước thực hiện")
            .WithDescription("FR-RCP-010. Các bước còn lại được đánh số lại liên tục 1, 2, 3...")
            .Produces(StatusCodes.Status204NoContent);

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
            $"{ApiVersioningExtensions.V1Path}/recipes/{recipeId}/steps/{step.Id}",
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

using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Recipes.Commands.AddRecipeIngredient;
using CulinaryBlog.Application.Recipes.Commands.DeleteRecipeIngredient;
using CulinaryBlog.Application.Recipes.Commands.UpdateRecipeIngredient;
using CulinaryBlog.Application.Recipes.Models;
using MediatR;

namespace CulinaryBlog.API.Endpoints;

/// <summary>
/// FR-RCP-009: /api/v1/recipes/{recipeId}/ingredients
/// </summary>
public static class RecipeIngredientEndpoints
{
    public static IEndpointRouteBuilder MapRecipeIngredientEndpoints(this IEndpointRouteBuilder app)
    {
        // Role Author/Admin tại endpoint; owner/Admin trên từng recipe do RecipeAuthorizationHandler kiểm tra.
        var group = app.MapVersionedApiGroup("RecipeIngredients", "recipes/{recipeId:guid}/ingredients")
            .WithTags("Recipe Ingredients")
            .RequireAuthorization(AuthServiceCollectionExtensions.AuthorPolicy)
            .ProducesAuthProblems()
            .ProducesNotFoundProblem();

        group.MapPost("/", AddAsync)
            .WithName("AddRecipeIngredient")
            .WithSummary("Thêm nguyên liệu")
            .WithDescription("FR-RCP-009. Chỉ owner hoặc Admin. Không gửi orderIndex thì xếp cuối danh sách.")
            .Produces<RecipeIngredientDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapPut("/{ingredientId:guid}", UpdateAsync)
            .WithName("UpdateRecipeIngredient")
            .WithSummary("Cập nhật nguyên liệu")
            .WithDescription("FR-RCP-009. Nguyên liệu không tồn tại: 404 INGREDIENT_NOT_FOUND.")
            .Produces<RecipeIngredientDto>()
            .ProducesValidationProblem();

        group.MapDelete("/{ingredientId:guid}", DeleteAsync)
            .WithName("DeleteRecipeIngredient")
            .WithSummary("Xóa nguyên liệu")
            .WithDescription("FR-RCP-009.")
            .Produces(StatusCodes.Status204NoContent);

        return app;
    }

    private static async Task<IResult> AddAsync(
        Guid recipeId,
        CreateIngredientRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var ingredient = await sender.Send(new AddRecipeIngredientCommand(recipeId, request), cancellationToken);
        return Results.Created(
            $"{ApiVersioningExtensions.V1Path}/recipes/{recipeId}/ingredients/{ingredient.Id}",
            ingredient);
    }

    private static async Task<IResult> UpdateAsync(
        Guid recipeId,
        Guid ingredientId,
        UpdateIngredientRequest request,
        ISender sender,
        CancellationToken cancellationToken) =>
        Results.Ok(await sender.Send(new UpdateRecipeIngredientCommand(recipeId, ingredientId, request), cancellationToken));

    private static async Task<IResult> DeleteAsync(
        Guid recipeId,
        Guid ingredientId,
        ISender sender,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteRecipeIngredientCommand(recipeId, ingredientId), cancellationToken);
        return Results.NoContent();
    }
}

using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Categories.Commands.CreateCategory;
using CulinaryBlog.Application.Categories.Commands.DeleteCategory;
using CulinaryBlog.Application.Categories.Commands.UpdateCategory;
using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Categories.Queries.GetCategories;
using CulinaryBlog.Application.Categories.Queries.GetCategoryBySlug;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Queries.GetRecipes;
using CulinaryBlog.Domain.Common.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

public static class CategoriesEndpoints
{
    public static IEndpointRouteBuilder MapCategoriesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Categories", "categories").WithTags("Categories");

        group.MapGet("/", async (ISender sender, CancellationToken ct) =>
                Results.Ok(await sender.Send(new GetCategoriesQuery(), ct)))
            .WithName("GetCategories").WithSummary("Danh sách danh mục")
            .Produces<IReadOnlyList<CategoryDto>>();

        group.MapGet("/{slug}", async (
                string slug,
                [AsParameters] RecipeQuery request,
                ISender sender,
                CancellationToken ct) =>
        {
            var category = await sender.Send(new GetCategoryBySlugQuery(slug), ct)
                ?? throw new NotFoundException(ErrorCodes.CategoryNotFound, $"Category '{slug}' không tồn tại.");
            var recipes = await sender.Send(
                new GetRecipesQuery(request with { CategoryId = category.Id }), ct);
            return Results.Ok(new CategoryDetailDto(category, recipes));
        }).WithName("GetCategoryBySlug").WithSummary("Chi tiết danh mục theo slug")
            .Produces<CategoryDetailDto>().ProducesNotFoundProblem().ProducesValidationProblem();

        group.MapGet("/{slug}/recipes", async (
                string slug,
                [AsParameters] RecipeQuery request,
                ISender sender,
                CancellationToken ct) =>
            {
                var category = await sender.Send(new GetCategoryBySlugQuery(slug), ct)
                    ?? throw new NotFoundException(ErrorCodes.CategoryNotFound, $"Category '{slug}' không tồn tại.");
                return Results.Ok(await sender.Send(
                    new GetRecipesQuery(request with { CategoryId = category.Id }), ct));
            })
            .WithName("GetCategoryRecipes")
            .WithSummary("Danh sách công thức theo category")
            .Produces<PagedResult<RecipeListItemDto>>()
            .ProducesNotFoundProblem()
            .ProducesValidationProblem();

        var admin = group.MapGroup(string.Empty)
            .RequireAuthorization(AuthServiceCollectionExtensions.AdminPolicy).ProducesAuthProblems();
        admin.MapPost("/", async (CreateCategoryRequest request, ISender sender, CancellationToken ct) =>
        {
            var created = await sender.Send(new CreateCategoryCommand(request), ct);
            return Results.Created($"{ApiVersioningExtensions.V1Path}/categories/{created.Slug}", created);
        }).WithName("CreateCategory").WithSummary("Tạo danh mục")
            .Produces<CategoryDto>(StatusCodes.Status201Created).ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapPut("/{id:guid}", async (
            Guid id,
            UpdateCategoryRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var updated = await sender.Send(new UpdateCategoryCommand(id, request), ct);
            return Results.Ok(updated);
        }).WithName("UpdateCategory").WithSummary("Cập nhật danh mục")
            .Produces<CategoryDto>().ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapDelete("/{id:guid}", async (Guid id, ISender sender, CancellationToken ct) =>
        {
            await sender.Send(new DeleteCategoryCommand(id), ct);
            return Results.NoContent();
        }).WithName("DeleteCategory").WithSummary("Xóa mềm danh mục")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
        return app;
    }
}

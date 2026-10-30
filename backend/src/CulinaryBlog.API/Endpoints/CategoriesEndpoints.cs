using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Categories.Commands.CreateCategory;
using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Categories.Queries.GetCategories;
using CulinaryBlog.Application.Categories.Queries.GetCategoryBySlug;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;
using MediatR;

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

        group.MapGet("/{slug}", async (string slug, ISender sender, CancellationToken ct) =>
        {
            var category = await sender.Send(new GetCategoryBySlugQuery(slug), ct)
                ?? throw new NotFoundException(ErrorCodes.CategoryNotFound, $"Category '{slug}' không tồn tại.");
            return Results.Ok(category);
        }).WithName("GetCategoryBySlug").WithSummary("Chi tiết danh mục theo slug")
            .Produces<CategoryDto>().ProducesNotFoundProblem();

        var admin = group.MapGroup(string.Empty)
            .RequireAuthorization(AuthServiceCollectionExtensions.AdminPolicy).ProducesAuthProblems();
        admin.MapPost("/", async (CreateCategoryRequest request, ISender sender, CancellationToken ct) =>
        {
            var created = await sender.Send(new CreateCategoryCommand(request), ct);
            return Results.Created($"{ApiVersioningExtensions.V1Path}/categories/{created.Slug}", created);
        }).WithName("CreateCategory").WithSummary("Tạo danh mục")
            .Produces<CategoryDto>(StatusCodes.Status201Created).ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);
        return app;
    }
}

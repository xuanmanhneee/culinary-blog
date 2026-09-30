using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Categories.Services;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;

namespace CulinaryBlog.API.Endpoints;

public static class CategoriesEndpoints
{
    public static IEndpointRouteBuilder MapCategoriesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/categories").WithTags("Categories");

        // FR-CAT-001: danh sách danh mục (public)
        group.MapGet("/", async (ICategoryService service, CancellationToken ct) =>
            Results.Ok(await service.GetAllAsync(ct)));

        // FR-CAT-002: chi tiết danh mục theo slug (public). Không có thì 404 qua middleware.
        group.MapGet("/{slug}", async (string slug, ICategoryService service, CancellationToken ct) =>
        {
            var category = await service.GetBySlugAsync(slug, ct)
                           ?? throw new NotFoundException(
                               ErrorCodes.CategoryNotFound, $"Category '{slug}' không tồn tại.");

            return Results.Ok(category);
        });

        // FR-CAT-003: tạo danh mục (Admin). TODO: .RequireAuthorization("Admin") khi có Auth.
        group.MapPost("/", async (CreateCategoryRequest request, ICategoryService service, CancellationToken ct) =>
        {
            var created = await service.CreateAsync(request, ct);
            return Results.Created($"/api/v1/categories/{created.Slug}", created);
        });

        return app;
    }
}
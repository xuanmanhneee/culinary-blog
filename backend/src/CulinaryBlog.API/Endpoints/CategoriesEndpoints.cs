using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Categories.Services;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;

namespace CulinaryBlog.API.Endpoints;

public static class CategoriesEndpoints
{
    public static IEndpointRouteBuilder MapCategoriesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Categories", "categories").WithTags("Categories");

        // FR-CAT-001: danh sách danh mục (public)
        group.MapGet("/", async (ICategoryService service, CancellationToken ct) =>
                Results.Ok(await service.GetAllAsync(ct)))
            .WithName("GetCategories")
            .WithSummary("Danh sách danh mục")
            .WithDescription("FR-CAT-001. Trả tất cả danh mục, sắp xếp theo thứ tự hiển thị.")
            .Produces<IReadOnlyList<CategoryDto>>();

        // FR-CAT-002: chi tiết danh mục theo slug (public). Không có thì 404 qua middleware.
        group.MapGet("/{slug}", async (string slug, ICategoryService service, CancellationToken ct) =>
        {
            var category = await service.GetBySlugAsync(slug, ct)
                           ?? throw new NotFoundException(
                               ErrorCodes.CategoryNotFound, $"Category '{slug}' không tồn tại.");

            return Results.Ok(category);
        })
            .WithName("GetCategoryBySlug")
            .WithSummary("Chi tiết danh mục theo slug")
            .WithDescription("FR-CAT-002. Danh mục không tồn tại: 404 CATEGORY_NOT_FOUND.")
            .Produces<CategoryDto>()
            .ProducesNotFoundProblem();

        // FR-CAT-003: tạo danh mục — chỉ Admin (SRS §2: Guest/Author không có quyền này).
        var admin = group.MapGroup(string.Empty)
            .RequireAuthorization(AuthServiceCollectionExtensions.AdminPolicy)
            .ProducesAuthProblems();

        admin.MapPost("/", async (CreateCategoryRequest request, ICategoryService service, CancellationToken ct) =>
            {
                var created = await service.CreateAsync(request, ct);
                return Results.Created($"{ApiVersioningExtensions.V1Path}/categories/{created.Slug}", created);
            })
            .WithName("CreateCategory")
            .WithSummary("Tạo danh mục")
            .WithDescription(
                "FR-CAT-003. Chỉ Admin. Trùng tên/slug: 409 CATEGORY_NAME_EXISTS / CATEGORY_SLUG_EXISTS.")
            .Produces<CategoryDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);

        return app;
    }
}
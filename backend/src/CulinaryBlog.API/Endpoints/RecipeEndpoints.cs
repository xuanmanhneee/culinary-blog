using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Common.Models;
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
/// FR-RCP-004: GET /api/v1/recipes/by-id/{id:guid} (trang edit, trả ETag), PUT /api/v1/recipes/{id:guid} (If-Match)
/// FR-RCP-005: PATCH /api/v1/recipes/{id:guid}/publish | /unpublish
/// FR-RCP-006: PATCH /api/v1/recipes/{id:guid}/archive
/// FR-RCP-007: DELETE /api/v1/recipes/{id:guid}
/// </summary>
public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Recipes", "recipes")
            .WithTags("Recipes");

        // Public: Guest xem được recipe Published; người đã đăng nhập (nếu gửi token)
        // xem thêm Draft/Archived của mình, Admin xem tất cả.
        group.MapGet("/", GetPagedAsync)
            .WithName("GetRecipes")
            .WithSummary("Danh sách công thức (phân trang, lọc, sắp xếp)")
            .WithDescription(
                "FR-RCP-001. Không gửi token: chỉ recipe Published. Gửi token: thêm Draft/Archived của chính mình; " +
                "Admin thấy mọi trạng thái. sort: createdAt | title | cookTime, thêm \"-\" để giảm dần (mặc định -createdAt). " +
                "pageSize 1–50 (mặc định 12). categoryId không tồn tại trả danh sách rỗng.")
            .Produces<PagedResult<RecipeListItemDto>>()
            .ProducesValidationProblem();

        group.MapGet("/search", SearchAsync)
            .WithName("SearchRecipes")
            .WithSummary("Tìm kiếm toàn văn công thức đã xuất bản")
            .WithDescription("FR-SEARCH-001. Tìm theo từ khóa q (tối thiểu 2 ký tự), hỗ trợ phân trang bằng page và pageSize (1–50).")
            .Produces<PagedResult<RecipeSummaryDto>>()
            .ProducesValidationProblem();

        group.MapGet("/{slug}", GetBySlugAsync)
            .WithName("GetRecipeBySlug")
            .WithSummary("Chi tiết công thức theo slug")
            .WithDescription(
                "FR-RCP-002. Gồm category, author, ảnh (ảnh chính đứng đầu), dinh dưỡng, nguyên liệu, các bước. " +
                "Recipe Draft/Archived chỉ owner hoặc Admin xem được (403 RECIPE_FORBIDDEN).")
            .Produces<RecipeDetailDto>()
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesNotFoundProblem();

        // Yêu cầu role Author/Admin (401 nếu chưa đăng nhập, 403 nếu thiếu role);
        // quyền trên từng recipe (owner/Admin) do RecipeAuthorizationHandler kiểm tra.
        var authorized = group.MapGroup(string.Empty)
            .RequireAuthorization(AuthServiceCollectionExtensions.AuthorPolicy)
            .ProducesAuthProblems();

        authorized.MapPost("/{id:guid}/images", UploadImageAsync)
            .WithName("UploadRecipeImage")
            .WithSummary("Tải ảnh công thức lên")
            .WithDescription("FR-FILE-001. Chỉ owner hoặc Admin. Gửi file qua multipart/form-data với field name 'file'.")
            .Accepts<IFormFile>("multipart/form-data")
            .Produces<RecipeImageDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesNotFoundProblem()
            .DisableAntiforgery();

        // {id:guid} khai báo riêng để không bị route {slug} bắt mất.
        authorized.MapGet("/by-id/{id:guid}", GetByIdAsync)
            .WithName("GetRecipeById")
            .WithSummary("Chi tiết công thức theo id (trang chỉnh sửa)")
            .WithDescription("FR-RCP-004. Chỉ owner hoặc Admin. Trả header ETag = rowVersion, gửi lại qua If-Match khi cập nhật.")
            .Produces<RecipeDetailDto>()
            .ProducesNotFoundProblem();

        authorized.MapPost("/", CreateAsync)
            .WithName("CreateRecipe")
            .WithSummary("Tạo công thức")
            .WithDescription(
                "FR-RCP-003. Tác giả là người đang đăng nhập; recipe mới luôn ở trạng thái Draft, slug sinh từ title. " +
                "Có thể gửi kèm nutrition, ingredients, steps. Trùng slug: 409 RECIPE_SLUG_EXISTS.")
            .Produces<RecipeDetailDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);

        authorized.MapPut("/{id:guid}", UpdateAsync)
            .WithName("UpdateRecipe")
            .WithSummary("Cập nhật công thức (kiểm soát đồng thời bằng If-Match)")
            .WithDescription(
                "FR-RCP-004. Gửi rowVersion qua header If-Match (hoặc field rowVersion). Bản cũ: 422 RECIPE_CONCURRENCY_CONFLICT. " +
                "Slug chỉ đổi theo title khi còn Draft (trùng: 409). Response kèm ETag mới.")
            .Produces<RecipeDetailDto>()
            .ProducesValidationProblem()
            .ProducesNotFoundProblem()
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity);

        authorized.MapPatch("/{id:guid}/publish", PublishAsync)
            .WithName("PublishRecipe")
            .WithSummary("Xuất bản công thức")
            .WithDescription(
                "FR-RCP-005. Cần ít nhất 1 bước (400 RECIPE_PUBLISH_INCOMPLETE). Đã Published thì vẫn trả 200 (idempotent).")
            .Produces<RecipeDetailDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesNotFoundProblem();

        authorized.MapPatch("/{id:guid}/unpublish", UnpublishAsync)
            .WithName("UnpublishRecipe")
            .WithSummary("Hủy xuất bản (đưa về Draft)")
            .WithDescription("FR-RCP-005. Cũng dùng để khôi phục recipe Archived. Idempotent.")
            .Produces<RecipeDetailDto>()
            .ProducesNotFoundProblem();

        authorized.MapPatch("/{id:guid}/archive", ArchiveAsync)
            .WithName("ArchiveRecipe")
            .WithSummary("Lưu trữ công thức")
            .WithDescription("FR-RCP-006. Ẩn khỏi danh sách công khai nhưng giữ dữ liệu. Idempotent.")
            .Produces<RecipeDetailDto>()
            .ProducesNotFoundProblem();

        authorized.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteRecipe")
            .WithSummary("Xóa vĩnh viễn công thức")
            .WithDescription("FR-RCP-007. Hard delete; nguyên liệu, bước, ảnh bị xóa theo (cascade).")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesNotFoundProblem();

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

    private static async Task<IResult> SearchAsync(
        ISender sender,
        CancellationToken cancellationToken,
        [FromQuery(Name = "q")] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Results.Ok(await sender.Send(
            new SearchRecipesQuery(searchTerm ?? string.Empty, page, pageSize),
            cancellationToken));

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

        return Results.Ok(recipe);
    }

    private static async Task<IResult> CreateAsync(
        CreateRecipeRequest request,
        IRecipeService service,
        CancellationToken cancellationToken)
    {
        var recipe = await service.CreateAsync(request, cancellationToken);
        return Results.Created($"{ApiVersioningExtensions.V1Path}/recipes/{recipe.Slug}", recipe);
    }
}

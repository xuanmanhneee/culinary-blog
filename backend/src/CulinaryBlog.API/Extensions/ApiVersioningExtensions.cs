using Asp.Versioning;
using Asp.Versioning.Builder;

namespace CulinaryBlog.API.Extensions;

/// <summary>
/// API versioning theo URL segment: /api/v{version}/... (phiên bản hiện tại 1.0 vẫn là /api/v1/...).
/// Version được đọc từ segment "v1", KHÔNG dùng query string, nên client cũ không phải đổi gì.
/// </summary>
public static class ApiVersioningExtensions
{
    /// <summary>Tên document OpenAPI cũng như GroupName của ApiDescription cho phiên bản 1 (khớp AddOpenApi mặc định).</summary>
    public const string V1GroupName = "v1";

    /// <summary>Tiền tố URL của phiên bản 1, dùng khi cần dựng Location header.</summary>
    public const string V1Path = "/api/v1";

    public static readonly ApiVersion V1 = new(1, 0);

    public static IServiceCollection AddCulinaryApiVersioning(this IServiceCollection services)
    {
        services
            .AddApiVersioning(options =>
            {
                options.DefaultApiVersion = V1;
                // Đọc phiên bản từ segment v1 trong URL; gọi /api/recipes (thiếu segment) sẽ 404.
                options.ApiVersionReader = new UrlSegmentApiVersionReader();
                // Thêm header api-supported-versions / api-deprecated-versions vào mọi response.
                options.ReportApiVersions = true;
            })
            .AddApiExplorer(options =>
            {
                // ApiDescription.GroupName = "v1" để OpenAPI sinh document riêng cho từng phiên bản.
                options.GroupNameFormat = "'v'VVV";
                // Thay {version:apiVersion} bằng giá trị thật trong tài liệu (/api/v1/recipes).
                options.SubstituteApiVersionInUrl = true;
            })
            // Thay cho AddOpenApi() thường: mỗi phiên bản có document riêng (AV0029).
            // options.Document là OpenApiOptions áp cho mọi document theo phiên bản.
            .AddOpenApi(options =>
            {
                options.Document.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
                options.Document.AddOperationTransformer<BearerSecuritySchemeTransformer>();
            });

        return services;
    }

    /// <summary>
    /// Tạo nhóm endpoint có version: /api/v{version:apiVersion}/{prefix} (ví dụ /api/v1/recipes).
    /// Thêm phiên bản mới bằng cách map thêm group với <c>HasApiVersion(2, 0)</c>.
    /// </summary>
    public static RouteGroupBuilder MapVersionedApiGroup(
        this IEndpointRouteBuilder app,
        string apiName,
        string prefix)
    {
        var api = app.NewVersionedApi(apiName);
        return api.MapGroup($"/api/v{{version:apiVersion}}/{prefix}").HasApiVersion(V1);
    }
}

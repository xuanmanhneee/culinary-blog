namespace CulinaryBlog.API.Extensions;

/// <summary>
/// NFR-SEC-005 / SRS 5.2: CORS chỉ cho phép các origin cấu hình trong appsettings (Cors:AllowedOrigins),
/// không dùng wildcard "*".
/// </summary>
public static class CorsServiceCollectionExtensions
{
    public const string SectionName = "Cors:AllowedOrigins";

    public static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection(SectionName).Get<string[]>() ?? [];

        if (allowedOrigins.Any(origin => origin.Contains('*')))
            throw new InvalidOperationException($"{SectionName} không được chứa wildcard \"*\" (NFR-SEC-005).");

        services.AddCors(options => options.AddDefaultPolicy(policy => policy
            .WithOrigins(allowedOrigins)
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            // If-Match: cập nhật recipe gửi RowVersion (FR-RCP-004).
            .WithHeaders("Content-Type", "Authorization", "X-Correlation-ID", "If-Match")
            // Cho JavaScript đọc được: ETag (RowVersion mới), Location (201 Created), Retry-After (429).
            .WithExposedHeaders("ETag", "Location", "Retry-After")
            // Trình duyệt cache kết quả preflight, giảm số request OPTIONS.
            .SetPreflightMaxAge(TimeSpan.FromMinutes(10))));

        return services;
    }
}

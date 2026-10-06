using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CulinaryBlog.API.Endpoints;

public static class HealthEndpoints
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/health")
            .WithTags("Health")
            .AllowAnonymous();

        // GET /health - tổng hợp tất cả dependencies (DB, Redis, MinIO)
        group.MapHealthChecks("/", new HealthCheckOptions
        {
            ResponseWriter = WriteResponse
        });

        // GET /health/live - chỉ kiểm tra process còn sống (không chạy check nào)
        group.MapHealthChecks("/live", new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = WriteResponse
        });

        // GET /health/ready - DB + Redis sẵn sàng nhận traffic
        group.MapHealthChecks("/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("ready"),
            ResponseWriter = WriteResponse
        });

        return app;
    }

    // 200 khi Healthy/Degraded, 503 khi Unhealthy (mặc định của HealthCheckOptions)
    private static Task WriteResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var payload = new
        {
            status = report.Status.ToString(),
            entries = report.Entries.ToDictionary(
                e => e.Key,
                e => new { status = e.Value.Status.ToString() })
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
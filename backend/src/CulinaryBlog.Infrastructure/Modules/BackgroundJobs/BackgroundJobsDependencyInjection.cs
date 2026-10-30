using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

internal static class BackgroundJobsDependencyInjection
{
    internal static IServiceCollection AddBackgroundJobsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Thiếu ConnectionStrings:DefaultConnection trong appsettings.json.");

        // Hangfire dùng PostgreSQL làm hàng đợi bền vững cho các background job.
        services.AddHangfire(options => options
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(storage => storage.UseNpgsqlConnection(connectionString)));

        services.AddHangfireServer();
        services.AddScoped<PingJob>();
        return services;
    }
}

using Hangfire;
using Hangfire.PostgreSql;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

internal static class DependencyInjection
{
    internal static IServiceCollection AddBackgroundJobs(
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
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));
        services.AddScoped<WelcomeEmailJob>();
        services.AddScoped<FileDeletionJob>();
        services.AddScoped<ThumbnailJob>();
        services.AddScoped<SitemapJob>();
        services.AddScoped<IWelcomeEmailScheduler, WelcomeEmailScheduler>();
        services.AddScoped<IFileDeletionScheduler, FileDeletionScheduler>();
        services.AddScoped<IThumbnailScheduler, ThumbnailScheduler>();
        return services;
    }
}

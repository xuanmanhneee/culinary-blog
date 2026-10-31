using Amazon.S3;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Infrastructure.Modules.Persistence.Local;
using CulinaryBlog.Infrastructure.Modules.Persistence.Minio;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Interceptors;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Modules.Persistence;

internal static class DependencyInjection
{
    internal static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        AddPostgreSql(services, configuration);
        AddFileStorage(services, configuration);
        return services;
    }

    private static void AddPostgreSql(
        IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Thiếu ConnectionStrings:DefaultConnection trong appsettings.json.");

        services.AddSingleton<AuditInterceptor>();
        services.AddDbContext<CulinaryBlogDbContext>((provider, options) =>
        {
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(CulinaryBlogDbContext).Assembly.FullName));
            options.AddInterceptors(provider.GetRequiredService<AuditInterceptor>());
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IdentitySeeder>();
        services.AddScoped<CategorySeeder>();
        services.AddScoped<RecipeSeeder>();
        services.AddHealthChecks()
            .AddDbContextCheck<CulinaryBlogDbContext>(name: "database", tags: ["ready"]);
    }

    private static void AddFileStorage(
        IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["Storage:Provider"];
        if (string.Equals(provider, "Local", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            return;
        }

        if (!string.Equals(provider, "Minio", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Storage:Provider phải là 'Local' hoặc 'Minio'.");
        }

        services.Configure<MinioOptions>(configuration.GetSection("Minio"));
        services.AddSingleton<IAmazonS3>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<MinioOptions>>().Value;
            return new AmazonS3Client(options.AccessKey, options.SecretKey, new AmazonS3Config
            {
                ServiceURL = options.Endpoint,
                ForcePathStyle = true,
                UseHttp = !options.UseHttps
            });
        });
        services.AddScoped<IFileStorageService, MinioFileStorageService>();
    }
}

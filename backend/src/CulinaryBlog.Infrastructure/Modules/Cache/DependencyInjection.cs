using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure.Modules.Cache;

internal static class DependencyInjection
{
    internal static IServiceCollection AddCache(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("Thiếu ConnectionStrings:Redis trong cấu hình.");

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = connectionString;
            options.InstanceName = "CulinaryBlog:";
        });
        services.AddScoped<ICacheService, RedisCacheService>();
        return services;
    }
}

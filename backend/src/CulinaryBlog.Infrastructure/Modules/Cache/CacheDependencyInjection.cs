using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure.Modules.Cache;

internal static class CacheDependencyInjection
{
    internal static IServiceCollection AddCacheModule(this IServiceCollection services)
    {
        services.AddScoped<ICacheService, LoggingCacheService>();
        return services;
    }
}

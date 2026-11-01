using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Recipes.Queries.SearchRecipes;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs;
using CulinaryBlog.Infrastructure.Modules.Cache;
using CulinaryBlog.Infrastructure.Modules.Categories;
using CulinaryBlog.Infrastructure.Modules.Identity;
using CulinaryBlog.Infrastructure.Modules.Persistence;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using CulinaryBlog.Infrastructure.Modules.Health;
using CulinaryBlog.Infrastructure.Modules.Recipes;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddPersistence(configuration);

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireDigit = true;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<CulinaryBlogDbContext>()
            .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, HttpCurrentUserService>();

        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IRecipeRepository, RecipeRepository>();
        services.AddScoped<IRecipeSearchReader, RecipeSearchReader>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        services.AddCache(configuration);
        services.AddHealthChecks()
            .AddCheck<RedisHealthCheck>("redis", tags: ["ready"]);
        services.AddBackgroundJobs(configuration);
        return services;
    }
}

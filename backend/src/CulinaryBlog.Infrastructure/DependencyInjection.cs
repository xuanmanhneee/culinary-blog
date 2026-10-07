using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Infrastructure.Modules.Categories;
using CulinaryBlog.Infrastructure.Modules.Identity;
using CulinaryBlog.Infrastructure.Modules.Recipes;
using CulinaryBlog.Infrastructure.Persistence;
using CulinaryBlog.Infrastructure.Persistence.Interceptors;
using CulinaryBlog.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Thiếu ConnectionStrings:DefaultConnection trong appsettings.json.");

        services.Configure<JwtOptions>(
            configuration.GetSection("Jwt"));

        services.AddSingleton<AuditInterceptor>();

        services.AddDbContext<CulinaryBlogDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(CulinaryBlogDbContext).Assembly.FullName));
            options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
        });
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<CulinaryBlogDbContext>());

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

        // Module Categories
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        // Module Recipes
        services.AddScoped<IRecipeRepository, RecipeRepository>();
        services.AddScoped<IJwtService, JwtService>();

        // Module Identity
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Seed data (dùng trong Development / lệnh seed riêng)
        services.AddScoped<IdentitySeeder>();
        services.AddScoped<CategorySeeder>();
        services.AddScoped<RecipeSeeder>();

        var healthChecks = services.AddHealthChecks()
            .AddDbContextCheck<CulinaryBlogDbContext>(name: "database", tags: new[] { "ready" });

        return services;
    }
}

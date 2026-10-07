using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Common.Abstractions;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CulinaryBlog.Infrastructure.Modules.Identity;

public static class IdentityModuleExtensions
{
    /// <summary>
    /// Gọi từ Infrastructure/DependencyInjection.cs. Chỉ cấu hình option và đăng ký service,
    /// không gọi AddIdentity/AddIdentityCore để tránh đăng ký trùng nếu đã có sẵn.
    /// </summary>
    public static IServiceCollection AddIdentityModule(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(o => !string.IsNullOrWhiteSpace(o.Key) && o.Key.Length >= 32,
                "Jwt:Key phải có tối thiểu 32 ký tự. Đặt bằng: dotnet user-secrets set \"Jwt:Key\" \"...\"")
            .ValidateOnStart();

        // NFR-SEC-001 + FR-AUTH-002 (lockout 5 lần / 15 phút)
        services.Configure<IdentityOptions>(o =>
        {
            o.Password.RequiredLength = 8;
            o.Password.RequireUppercase = true;
            o.Password.RequireLowercase = true;
            o.Password.RequireDigit = true;
            o.Password.RequireNonAlphanumeric = true;

            o.User.RequireUniqueEmail = true;

            o.Lockout.AllowedForNewUsers = true;
            o.Lockout.MaxFailedAccessAttempts = 5;
            o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        });

        services.AddSingleton<IJwtService, JwtService>();
        services.TryAddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUserDirectory, UserDirectory>();

        return services;
    }
}
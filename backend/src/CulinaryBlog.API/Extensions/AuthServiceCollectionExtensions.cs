using System.Text;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Infrastructure.Modules.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace CulinaryBlog.API.Extensions;

public static class AuthServiceCollectionExtensions
{
    public const string AuthorPolicy = "AuthorPolicy";
    public const string AdminPolicy = "AdminPolicy";
    /// <summary>NFR-SEC-003: /auth/* giới hạn 10 request/phút/IP; xem <see cref="RateLimitingExtensions"/>.</summary>
    public const string AuthRateLimitPolicy = RateLimitPolicies.Auth;

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                  ?? throw new InvalidOperationException("Thiếu cấu hình section 'Jwt'.");

        if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
            throw new InvalidOperationException(
                "Jwt:Key phải có tối thiểu 32 ký tự. Đặt bằng: dotnet user-secrets set \"Jwt:Key\" \"...\"");

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme =
                    JwtBearerDefaults.AuthenticationScheme;

                options.DefaultChallengeScheme =
                    JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                // Giữ nguyên tên claim gốc ("sub", "role") thay vì map sang ClaimTypes.*
                options.MapInboundClaims = false;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = "sub",
                    RoleClaimType = "role"
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(AuthorPolicy, p => p.RequireRole(Roles.Author, Roles.Admin))
            .AddPolicy(AdminPolicy, p => p.RequireRole(Roles.Admin));

        return services;
    }
}

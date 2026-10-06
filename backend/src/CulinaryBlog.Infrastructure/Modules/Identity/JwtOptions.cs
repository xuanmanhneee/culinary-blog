namespace CulinaryBlog.Infrastructure.Modules.Identity;

/// <summary>
/// Gom toàn bộ cấu hình token vào một chỗ. Key KHÔNG đặt trong appsettings.json:
/// dotnet user-secrets set "Jwt:Key" "&lt;chuỗi ngẫu nhiên &gt;= 32 ký tự&gt;"
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "CulinaryBlog";
    public string Audience { get; set; } = "CulinaryBlog.Client";
    public string Key { get; set; } = default!;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
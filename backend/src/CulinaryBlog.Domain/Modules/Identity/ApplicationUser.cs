using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Domain.Modules.Identity;

/// <summary>
/// Mở rộng từ ASP.NET Core Identity IdentityUser. Bảng "AspNetUsers".
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = default!;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    private readonly List<Recipe> _recipes = new();
    public IReadOnlyCollection<Recipe> Recipes => _recipes.AsReadOnly();

    private readonly List<RefreshToken> _refreshTokens = new();
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    /// <summary>
    /// Factory method theo SRS FR-AUTH-001. Mật khẩu được set qua UserManager.CreateAsync.
    /// </summary>
    public static ApplicationUser Create(string displayName, string email, string userName)
    {
        return new ApplicationUser
        {
            DisplayName = displayName,
            Email = email,
            UserName = userName,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
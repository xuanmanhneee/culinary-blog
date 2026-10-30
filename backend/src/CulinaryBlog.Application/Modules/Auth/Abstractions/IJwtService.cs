using CulinaryBlog.Domain.Modules.Identity;

namespace CulinaryBlog.Application.Auth.Abstractions;

public record AccessTokenResult(string Token, DateTimeOffset ExpiresAt);

/// <param name="RawToken">Giá trị trả cho client, KHÔNG lưu DB.</param>
/// <param name="TokenHash">SHA-256 của RawToken, giá trị lưu DB.</param>
public record RefreshTokenResult(string RawToken, string TokenHash, DateTimeOffset ExpiresAt);

public interface IJwtService
{
    AccessTokenResult GenerateAccessToken(ApplicationUser user, IEnumerable<string> roles);

    RefreshTokenResult GenerateRefreshToken();

    string HashToken(string rawToken);
}
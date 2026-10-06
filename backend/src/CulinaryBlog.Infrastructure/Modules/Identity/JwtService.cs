using System.Buffers.Text;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace CulinaryBlog.Infrastructure.Modules.Identity;

public sealed class JwtService : IJwtService
{
    private readonly JwtOptions _options;
    private readonly SigningCredentials _credentials;
    private readonly JsonWebTokenHandler _handler = new();

    public JwtService(IOptions<JwtOptions> options)
    {
        _options = options.Value;

        if (string.IsNullOrWhiteSpace(_options.Key))
            throw new InvalidOperationException(
                "Jwt:Key chưa được cấu hình.");

        if (_options.Key.Length < 32)
            throw new InvalidOperationException(
                "Jwt:Key phải có ít nhất 32 ký tự.");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_options.Key));

        _credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);
    }

    public AccessTokenResult GenerateAccessToken(
        ApplicationUser user,
        IEnumerable<string> roles)
    {
        var expires = DateTimeOffset.UtcNow
            .AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(
            roles.Select(role => new Claim("role", role)));

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Subject = new ClaimsIdentity(claims),
            Expires = expires.UtcDateTime,
            SigningCredentials = _credentials
        };

        return new AccessTokenResult(
            _handler.CreateToken(descriptor),
            expires);
    }

    public RefreshTokenResult GenerateRefreshToken()
    {
        var raw = Base64Url.EncodeToString(
            RandomNumberGenerator.GetBytes(32));

        var expires = DateTimeOffset.UtcNow
            .AddDays(_options.RefreshTokenDays);

        return new RefreshTokenResult(
            raw,
            HashToken(raw),
            expires);
    }

    public string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(rawToken));

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
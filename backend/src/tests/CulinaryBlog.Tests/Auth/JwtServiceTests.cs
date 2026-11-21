using CulinaryBlog.Infrastructure.Modules.Identity;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Tests.Auth;

public sealed class JwtServiceTests
{
    [Fact]
    public void GenerateRefreshToken_Uses64RandomBytesAndSha256Hash()
    {
        var service = new JwtService(Options.Create(new JwtOptions
        {
            Key = new string('k', 32),
            RefreshTokenDays = 7
        }));

        var token = service.GenerateRefreshToken();
        var rawBytes = Convert.FromBase64String(
            token.RawToken.Replace('-', '+').Replace('_', '/') + "==");

        Assert.Equal(64, rawBytes.Length);
        Assert.Equal(86, token.RawToken.Length);
        Assert.Equal(64, token.TokenHash.Length);
        Assert.Equal(32, Convert.FromHexString(token.TokenHash).Length);
        Assert.Equal(service.HashToken(token.RawToken), token.TokenHash);
    }
}

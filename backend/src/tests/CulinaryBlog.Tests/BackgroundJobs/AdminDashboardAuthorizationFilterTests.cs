using System.Text;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

namespace CulinaryBlog.Tests.BackgroundJobs;

public sealed class AdminDashboardAuthorizationFilterTests
{
    [Theory]
    [InlineData("admin", "secret", true)]
    [InlineData("admin", "wrong", false)]
    [InlineData("other", "secret", false)]
    public void CredentialsMatch_ValidatesBothValues(string username, string password, bool expected)
    {
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));

        Assert.Equal(expected, AdminDashboardAuthorizationFilter.CredentialsMatch(
            $"Basic {credentials}", "admin", "secret"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Bearer token")]
    [InlineData("Basic invalid-base64")]
    public void CredentialsMatch_RejectsMissingOrMalformedHeaders(string? authorization) =>
        Assert.False(AdminDashboardAuthorizationFilter.CredentialsMatch(
            authorization, "admin", "secret"));
}

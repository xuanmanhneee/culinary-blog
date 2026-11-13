using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using Hangfire.Dashboard;
using Microsoft.Extensions.Configuration;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

internal sealed class AdminDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    private readonly string? _username;
    private readonly string? _password;

    public AdminDashboardAuthorizationFilter(IConfiguration configuration) =>
        (_username, _password) = (
            configuration["HangfireDashboard:Username"],
            configuration["HangfireDashboard:Password"]);

    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        if (httpContext.User.Identity?.IsAuthenticated == true && httpContext.User.IsInRole("Admin"))
            return true;

        if (CredentialsMatch(httpContext.Request.Headers.Authorization, _username, _password))
            return true;

        httpContext.Response.Headers.WWWAuthenticate = "Basic realm=\"Hangfire Dashboard\"";
        return false;
    }

    internal static bool CredentialsMatch(string? authorization, string? username, string? password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) ||
            !AuthenticationHeaderValue.TryParse(authorization, out var header) ||
            !header.Scheme.Equals("Basic", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(header.Parameter))
            return false;

        string decoded;
        try
        {
            decoded = Encoding.UTF8.GetString(Convert.FromBase64String(header.Parameter));
        }
        catch (FormatException)
        {
            return false;
        }

        var separator = decoded.IndexOf(':');
        if (separator < 1) return false;

        return FixedTimeEquals(decoded[..separator], username) &&
               FixedTimeEquals(decoded[(separator + 1)..], password);
    }

    private static bool FixedTimeEquals(string actual, string expected) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(actual), Encoding.UTF8.GetBytes(expected));
}

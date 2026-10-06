using System.Security.Claims;

namespace CulinaryBlog.API.Extensions;

public static class HttpContextExtensions
{
    /// <summary>
    /// Đọc user id từ claim "sub" (MapInboundClaims = false), fallback sang NameIdentifier.
    /// </summary>
    public static string? GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

    public static string? GetClientIp(this HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString();
}
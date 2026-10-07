using Microsoft.AspNetCore.Mvc;

using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Auth.Services;

namespace CulinaryBlog.API.Endpoints;

// public static class AuthEndpoints
// {
//     public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
//     {
//         var group = app.MapGroup("/api/v1/auth")
//             .WithTags("Auth")
//             .RequireRateLimiting(AuthServiceCollectionExtensions.AuthRateLimitPolicy);

//         // FR-AUTH-001
//         group.MapPost("/register", async (
//                 RegisterRequest request, IAuthService auth, HttpContext http, CancellationToken ct) =>
//             {
//                 var result = await auth.RegisterAsync(request, http.GetClientIp(), ct);
//                 return Results.Created("/api/v1/auth/me", result);
//             })
//             .AllowAnonymous();

//         // FR-AUTH-002
//         group.MapPost("/login", async (
//                 LoginRequest request, IAuthService auth, HttpContext http, CancellationToken ct) =>
//                 Results.Ok(await auth.LoginAsync(request, http.GetClientIp(), ct)))
//             .AllowAnonymous();

//         // FR-AUTH-004
//         group.MapPost("/refresh", async (
//                 RefreshRequest request, IAuthService auth, HttpContext http, CancellationToken ct) =>
//                 Results.Ok(await auth.RefreshAsync(request, http.GetClientIp(), ct)))
//             .AllowAnonymous();

//         // FR-AUTH-005
//         group.MapPost("/logout", async (
//                 LogoutRequest request, IAuthService auth, HttpContext http, CancellationToken ct) =>
//             {
//                 var userId = http.User.GetUserId();
//                 if (userId is null) return Results.Unauthorized();

//                 await auth.LogoutAsync(userId, request.RefreshToken, ct);
//                 return Results.NoContent();
//             })
//             .RequireAuthorization();

//         // FR-AUTH-006
//         group.MapGet("/me", async (HttpContext http, IAuthService auth, CancellationToken ct) =>
//             {
//                 var userId = http.User.GetUserId();
//                 if (userId is null) return Results.Unauthorized();

//                 return Results.Ok(await auth.GetProfileAsync(userId, ct));
//             })
//             .RequireAuthorization();

//         // FR-AUTH-007
//         group.MapPatch("/me", async (
//                 UpdateProfileRequest request, HttpContext http, IAuthService auth, CancellationToken ct) =>
//             {
//                 var userId = http.User.GetUserId();
//                 if (userId is null) return Results.Unauthorized();

//                 return Results.Ok(await auth.UpdateProfileAsync(userId, request, ct));
//             })
//             .RequireAuthorization();

//         return app;
//     }
// }

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth")
            .WithTags("Auth")
            .RequireRateLimiting(AuthServiceCollectionExtensions.AuthRateLimitPolicy);

        // FR-AUTH-001
        group.MapPost("/register", async (
            RegisterRequest request,
            [FromServices] IAuthService auth,
            HttpContext http,
            CancellationToken ct) =>
        {
            var result = await auth.RegisterAsync(
                request,
                http.GetClientIp(),
                ct);

            return Results.Created("/api/v1/auth/me", result);
        })
        .AllowAnonymous();

        // FR-AUTH-002
        group.MapPost("/login", async (
            LoginRequest request,
            [FromServices] IAuthService auth,
            HttpContext http,
            CancellationToken ct) =>
        {
            var result = await auth.LoginAsync(
                request,
                http.GetClientIp(),
                ct);

            return Results.Ok(result);
        })
        .AllowAnonymous();

        // FR-AUTH-004
        group.MapPost("/refresh", async (
            RefreshRequest request,
            [FromServices] IAuthService auth,
            HttpContext http,
            CancellationToken ct) =>
        {
            var result = await auth.RefreshAsync(
                request,
                http.GetClientIp(),
                ct);

            return Results.Ok(result);
        })
        .AllowAnonymous();

        // FR-AUTH-005
        group.MapPost("/logout", async (
            LogoutRequest request,
            [FromServices] IAuthService auth,
            HttpContext http,
            CancellationToken ct) =>
        {
            var userId = http.User.GetUserId();

            if (userId is null)
                return Results.Unauthorized();

            await auth.LogoutAsync(
                userId,
                request.RefreshToken,
                ct);

            return Results.NoContent();
        })
        .RequireAuthorization();

        // FR-AUTH-006
        group.MapGet("/me", async (
            [FromServices] IAuthService auth,
            HttpContext http,
            CancellationToken ct) =>
        {
            var userId = http.User.GetUserId();

            if (userId is null)
                return Results.Unauthorized();

            var result = await auth.GetProfileAsync(userId, ct);

            return Results.Ok(result);
        })
        .RequireAuthorization();

        // FR-AUTH-007
        group.MapPatch("/me", async (
            UpdateProfileRequest request,
            [FromServices] IAuthService auth,
            HttpContext http,
            CancellationToken ct) =>
        {
            var userId = http.User.GetUserId();

            if (userId is null)
                return Results.Unauthorized();

            var result = await auth.UpdateProfileAsync(
                userId,
                request,
                ct);

            return Results.Ok(result);
        })
        .RequireAuthorization();

        return app;
    }
}
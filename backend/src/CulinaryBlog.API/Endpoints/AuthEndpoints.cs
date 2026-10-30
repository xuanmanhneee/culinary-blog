using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Auth.Commands.Login;
using CulinaryBlog.Application.Auth.Commands.Logout;
using CulinaryBlog.Application.Auth.Commands.RefreshToken;
using CulinaryBlog.Application.Auth.Commands.Register;
using CulinaryBlog.Application.Auth.Commands.UpdateCurrentUser;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Auth.Queries.GetCurrentUser;
using MediatR;

namespace CulinaryBlog.API.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Auth", "auth")
            .WithTags("Auth")
            .RequireRateLimiting(AuthServiceCollectionExtensions.AuthRateLimitPolicy);

        // FR-AUTH-001: đăng ký tài khoản mới.
        group.MapPost("/register", async (
            RegisterRequest request,
            ISender sender,
            HttpContext http,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new RegisterCommand(request, http.GetClientIp()), ct);
            return Results.Created($"{ApiVersioningExtensions.V1Path}/auth/me", result);
        })
        .AllowAnonymous()
        .WithName("Register")
        .WithSummary("Đăng ký tài khoản")
        .Produces<AuthResponseDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status409Conflict);

        // FR-AUTH-002: đăng nhập bằng email và mật khẩu.
        group.MapPost("/login", async (
            LoginRequest request,
            ISender sender,
            HttpContext http,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new LoginCommand(request, http.GetClientIp()), ct);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .WithName("Login")
        .WithSummary("Đăng nhập bằng email và mật khẩu")
        .Produces<AuthResponseDto>()
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // FR-AUTH-004: luân chuyển refresh token.
        group.MapPost("/refresh", async (
            RefreshRequest request,
            ISender sender,
            HttpContext http,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new RefreshTokenCommand(request, http.GetClientIp()), ct);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .WithName("RefreshAccessToken")
        .WithSummary("Đổi refresh token lấy access token mới")
        .Produces<AuthResponseDto>()
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // FR-AUTH-005: thu hồi refresh token hiện tại.
        group.MapPost("/logout", async (
            LogoutRequest request,
            ISender sender,
            HttpContext http,
            CancellationToken ct) =>
        {
            var userId = http.User.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            await sender.Send(new LogoutCommand(userId, request.RefreshToken), ct);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("Logout")
        .WithSummary("Thu hồi refresh token và đăng xuất")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesAuthProblems();

        // FR-AUTH-006: lấy hồ sơ của người dùng hiện tại.
        group.MapGet("/me", async (
            ISender sender,
            HttpContext http,
            CancellationToken ct) =>
        {
            var userId = http.User.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await sender.Send(new GetCurrentUserQuery(userId), ct);
            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("GetCurrentUser")
        .WithSummary("Lấy hồ sơ người dùng hiện tại")
        .Produces<UserProfileDto>()
        .ProducesAuthProblems();

        // FR-AUTH-007: cập nhật từng phần hồ sơ.
        group.MapPatch("/me", async (
            UpdateProfileRequest request,
            ISender sender,
            HttpContext http,
            CancellationToken ct) =>
        {
            var userId = http.User.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await sender.Send(new UpdateCurrentUserCommand(userId, request), ct);
            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("UpdateCurrentUser")
        .WithSummary("Cập nhật hồ sơ người dùng hiện tại")
        .Produces<UserProfileDto>()
        .ProducesValidationProblem()
        .ProducesAuthProblems();

        return app;
    }
}

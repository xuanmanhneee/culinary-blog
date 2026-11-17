using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Auth.Commands.Login;
using CulinaryBlog.Application.Auth.Commands.GoogleLogin;
using CulinaryBlog.Application.Auth.Commands.Logout;
using CulinaryBlog.Application.Auth.Commands.RefreshToken;
using CulinaryBlog.Application.Auth.Commands.Register;
using CulinaryBlog.Application.Auth.Commands.UpdateCurrentUser;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Auth.Queries.GetCurrentUser;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;

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
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new RegisterCommand(request, http.GetClientIp()), ct);
            var logger = loggerFactory.CreateLogger("CulinaryBlog.API.Endpoints.AuthEndpoints");
            logger.LogInformation("User registered: {UserId}", result.User.Id);
            return Results.Created($"{ApiVersioningExtensions.V1Path}/auth/me", result);
        })
        .AllowAnonymous()
        .WithName("Register")
        .WithSummary("Đăng ký tài khoản")
        .Produces<AuthResponseDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapGet("/confirm-email", async (
            [Microsoft.AspNetCore.Mvc.FromQuery] string userId,
            [Microsoft.AspNetCore.Mvc.FromQuery] string token,
            UserManager<ApplicationUser> users) =>
        {
            var user = await users.FindByIdAsync(userId);
            if (user is null) return Results.BadRequest(new { error = "Invalid email confirmation link." });

            var result = await users.ConfirmEmailAsync(user, token);
            return result.Succeeded
                ? Results.Ok(new { message = "Email confirmed." })
                : Results.BadRequest(new { error = "Invalid or expired email confirmation link." });
        })
        .AllowAnonymous()
        .WithName("ConfirmEmail")
        .WithSummary("Xác nhận email tài khoản")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest);

        // FR-AUTH-002: đăng nhập bằng email và mật khẩu.
        group.MapPost("/login", async (
            LoginRequest request,
            ISender sender,
            HttpContext http,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new LoginCommand(request, http.GetClientIp()), ct);
            var logger = loggerFactory.CreateLogger("CulinaryBlog.API.Endpoints.AuthEndpoints");
            logger.LogInformation("User logged in: {UserId}", result.User.Id);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .WithName("Login")
        .WithSummary("Đăng nhập bằng email và mật khẩu")
        .Produces<AuthResponseDto>()
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // FR-AUTH-003: xác minh Google ID token, tạo/liên kết tài khoản và phát JWT nội bộ.
        group.MapPost("/google", async (
            GoogleLoginRequest request,
            ISender sender,
            HttpContext http,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new GoogleLoginCommand(request, http.GetClientIp()), ct);
            var logger = loggerFactory.CreateLogger("CulinaryBlog.API.Endpoints.AuthEndpoints");
            logger.LogInformation("User authenticated with Google: {UserId}", result.User.Id);
            return Results.Ok(result);
        })
        .AllowAnonymous()
        .WithName("GoogleLogin")
        .WithSummary("Đăng nhập hoặc đăng ký bằng Google")
        .Produces<AuthResponseDto>()
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status409Conflict);

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

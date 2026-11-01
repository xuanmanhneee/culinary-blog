using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Auth;

/// <summary>
/// Chứa các thao tác dùng chung giữa các auth handler, không đóng vai trò service nghiệp vụ.
/// </summary>
internal static class AuthUseCaseSupport
{
    public const string InvalidCredentials = "Email hoặc mật khẩu không đúng.";
    public const string InvalidRefreshToken = "Refresh token không hợp lệ hoặc đã hết hạn.";

    public static async Task<AuthResponseDto> IssueTokensAsync(
        ApplicationUser user,
        string? ipAddress,
        UserManager<ApplicationUser> users,
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var roles = await users.GetRolesAsync(user);
        var access = jwt.GenerateAccessToken(user, roles);
        var refresh = jwt.GenerateRefreshToken();

        await tokens.AddAsync(
            RefreshToken.Create(user.Id, refresh.TokenHash, refresh.ExpiresAt, ipAddress),
            ct);
        await unitOfWork.SaveChangesAsync(ct);

        return BuildResponse(user, roles, access, refresh);
    }

    public static AuthResponseDto BuildResponse(
        ApplicationUser user,
        IList<string> roles,
        AccessTokenResult access,
        RefreshTokenResult refresh)
    {
        var dto = new AuthUserDto(
            user.Id,
            user.DisplayName,
            user.Email!,
            user.UserName!,
            user.AvatarUrl,
            roles.ToList());

        return new AuthResponseDto(access.Token, refresh.RawToken, access.ExpiresAt, dto);
    }

    public static async Task<UserProfileDto> ToProfileAsync(
        ApplicationUser user,
        UserManager<ApplicationUser> users)
    {
        var roles = await users.GetRolesAsync(user);

        return new UserProfileDto(
            user.Id,
            user.DisplayName,
            user.Email!,
            user.UserName!,
            user.AvatarUrl,
            roles.ToList(),
            user.EmailConfirmed,
            user.CreatedAt);
    }

    public static async Task<ForbiddenException> CreateLockedExceptionAsync(
        ApplicationUser user,
        UserManager<ApplicationUser> users)
    {
        var end = await users.GetLockoutEndDateAsync(user);
        var minutes = end is null
            ? 15
            : Math.Max(1, (int)Math.Ceiling((end.Value - DateTimeOffset.UtcNow).TotalMinutes));

        return new ForbiddenException(
            ErrorCodes.AccountLocked,
            $"Tài khoản đang bị khóa. Thử lại sau {minutes} phút.");
    }

    public static Dictionary<string, string[]> ToErrors(IEnumerable<IdentityError> errors) =>
        errors
            .GroupBy(error => error.Code.StartsWith("Password", StringComparison.Ordinal)
                ? "password"
                : "user")
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.Description).ToArray());

    public static ValidationException Invalid(IDictionary<string, string[]> errors) => new(errors);
}

using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Application.Auth.Services;

public class AuthService : IAuthService
{
    private const string InvalidCredentials = "Email hoặc mật khẩu không đúng.";
    private const string InvalidRefreshToken = "Refresh token không hợp lệ hoặc đã hết hạn.";

    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtService _jwt;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> users,
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork uow,
        ILogger<AuthService> logger)
    {
        _users = users;
        _jwt = jwt;
        _tokens = tokens;
        _uow = uow;
        _logger = logger;
    }

    // ---------------------------------------------------------------- FR-AUTH-001
    public async Task<AuthResponseDto> RegisterAsync(
        RegisterRequest request, string? ipAddress, CancellationToken ct = default)
    {
        var errors = AuthRequestValidator.Validate(request);
        if (errors.Count > 0) throw Invalid(errors);

        var email = request.Email.Trim();
        var userName = request.UserName.Trim();

        if (await _users.FindByEmailAsync(email) is not null)
            throw new ConflictException(
                ErrorCodes.AuthEmailExists,
                "Email đã được đăng ký.");

        if (await _users.FindByNameAsync(userName) is not null)
            throw new ConflictException(
                ErrorCodes.AuthEmailExists,
                "Tên đăng nhập đã được sử dụng.");

        var user = ApplicationUser.Create(
            request.FullName.Trim(),
            email,
            userName);

        var created = await _users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            throw Invalid(ToErrors(created.Errors));

        var roleResult = await _users.AddToRoleAsync(user, Roles.Author);
        if (!roleResult.Succeeded)
        {
            await _users.DeleteAsync(user);

            throw new InvalidOperationException(
                "Không gán được role mặc định. Kiểm tra IdentitySeeder.SeedRolesAsync đã chạy chưa: "
                + string.Join(", ", roleResult.Errors.Select(e => e.Description)));
        }

        return await IssueTokensAsync(user, ipAddress, ct);
    }

    // ---------------------------------------------------------------- FR-AUTH-002
    public async Task<AuthResponseDto> LoginAsync(
        LoginRequest request, string? ipAddress, CancellationToken ct = default)
    {
        var errors = AuthRequestValidator.Validate(request);
        if (errors.Count > 0) throw Invalid(errors);

        var user = await _users.FindByEmailAsync(request.Email.Trim());

        if (user is null || !user.IsActive)
            throw new UnauthorizedException(
                ErrorCodes.AuthInvalidCredentials,
                InvalidCredentials);

        if (await _users.IsLockedOutAsync(user))
            throw await LockedAsync(user);

        if (!await _users.CheckPasswordAsync(user, request.Password))
        {
            await _users.AccessFailedAsync(user);

            if (await _users.IsLockedOutAsync(user))
                throw await LockedAsync(user);

            throw new UnauthorizedException(
                ErrorCodes.AuthInvalidCredentials,
                InvalidCredentials);
        }

        await _users.ResetAccessFailedCountAsync(user);
        return await IssueTokensAsync(user, ipAddress, ct);
    }

    // ---------------------------------------------------------------- FR-AUTH-004
    public async Task<AuthResponseDto> RefreshAsync(
        RefreshRequest request, string? ipAddress, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            throw new UnauthorizedException(
                ErrorCodes.AuthInvalidCredentials,
                InvalidRefreshToken);

        var hash = _jwt.HashToken(request.RefreshToken);

        var stored = await _tokens.GetByHashAsync(hash, ct)
                     ?? throw new UnauthorizedException(
                         ErrorCodes.AuthInvalidCredentials,
                         InvalidRefreshToken);

        if (stored.IsRevoked)
        {
            if (stored.ReplacedByTokenHash is not null)
            {
                _logger.LogWarning(
                    "SECURITY: refresh token reuse detected. UserId={UserId}, Ip={Ip}. Revoking all active tokens.",
                    stored.UserId, ipAddress);

                await RevokeAllActiveAsync(stored.UserId, ct);
            }

            throw new UnauthorizedException(
                ErrorCodes.AuthInvalidCredentials,
                InvalidRefreshToken);
        }

        if (stored.IsExpired)
            throw new UnauthorizedException(
                ErrorCodes.AuthInvalidCredentials,
                InvalidRefreshToken);

        var user = await _users.FindByIdAsync(stored.UserId);

        if (user is null || !user.IsActive || await _users.IsLockedOutAsync(user))
            throw new UnauthorizedException(
                ErrorCodes.AuthInvalidCredentials,
                InvalidRefreshToken);

        var roles = await _users.GetRolesAsync(user);
        var access = _jwt.GenerateAccessToken(user, roles);
        var newRefresh = _jwt.GenerateRefreshToken();

        stored.Revoke(newRefresh.TokenHash);

        await _tokens.AddAsync(
            RefreshToken.Create(
                user.Id,
                newRefresh.TokenHash,
                newRefresh.ExpiresAt,
                ipAddress),
            ct);

        await _uow.SaveChangesAsync(ct);

        return BuildResponse(user, roles, access, newRefresh);
    }

    // ---------------------------------------------------------------- FR-AUTH-005
    public async Task LogoutAsync(
        string userId,
        string refreshToken,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;

        var stored = await _tokens.GetByHashAsync(
            _jwt.HashToken(refreshToken), ct);

        if (stored is null || stored.UserId != userId) return;

        stored.Revoke();
        await _uow.SaveChangesAsync(ct);
    }

    // ---------------------------------------------------------------- FR-AUTH-006
    public async Task<UserProfileDto> GetProfileAsync(
        string userId,
        CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(userId)
                   ?? throw new NotFoundException(
                       ErrorCodes.AuthInvalidCredentials,
                       "Người dùng không tồn tại.");

        return await ToProfileAsync(user);
    }

    // ---------------------------------------------------------------- FR-AUTH-007
    public async Task<UserProfileDto> UpdateProfileAsync(
        string userId,
        UpdateProfileRequest request,
        CancellationToken ct = default)
    {
        var errors = AuthRequestValidator.Validate(request);
        if (errors.Count > 0) throw Invalid(errors);

        var user = await _users.FindByIdAsync(userId)
                   ?? throw new NotFoundException(
                       ErrorCodes.AuthInvalidCredentials,
                       "Người dùng không tồn tại.");

        if (request.FullName is not null)
            user.DisplayName = request.FullName.Trim();

        if (request.AvatarUrl is not null)
            user.AvatarUrl = request.AvatarUrl.Length == 0
                ? null
                : request.AvatarUrl;

        var result = await _users.UpdateAsync(user);
        if (!result.Succeeded)
            throw Invalid(ToErrors(result.Errors));

        return await ToProfileAsync(user);
    }

    // ---------------------------------------------------------------- helpers

    private async Task<AuthResponseDto> IssueTokensAsync(
        ApplicationUser user,
        string? ipAddress,
        CancellationToken ct)
    {
        var roles = await _users.GetRolesAsync(user);
        var access = _jwt.GenerateAccessToken(user, roles);
        var refresh = _jwt.GenerateRefreshToken();

        await _tokens.AddAsync(
            RefreshToken.Create(
                user.Id,
                refresh.TokenHash,
                refresh.ExpiresAt,
                ipAddress),
            ct);

        await _uow.SaveChangesAsync(ct);

        return BuildResponse(user, roles, access, refresh);
    }

    private static AuthResponseDto BuildResponse(
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

        return new AuthResponseDto(
            access.Token,
            refresh.RawToken,
            access.ExpiresAt,
            dto);
    }

    private async Task<UserProfileDto> ToProfileAsync(
        ApplicationUser user)
    {
        var roles = await _users.GetRolesAsync(user);

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

    private async Task RevokeAllActiveAsync(
        string userId,
        CancellationToken ct)
    {
        var active = await _tokens.GetActiveByUserAsync(userId, ct);

        foreach (var token in active)
            token.Revoke();

        await _uow.SaveChangesAsync(ct);
    }

    private async Task<ForbiddenException> LockedAsync(
        ApplicationUser user)
    {
        var end = await _users.GetLockoutEndDateAsync(user);

        var minutes = end is null
            ? 15
            : Math.Max(
                1,
                (int)Math.Ceiling(
                    (end.Value - DateTimeOffset.UtcNow).TotalMinutes));

        return new ForbiddenException(
            ErrorCodes.AccountLocked,
            $"Tài khoản đang bị khóa. Thử lại sau {minutes} phút.");
    }

    private static Dictionary<string, string[]> ToErrors(
        IEnumerable<IdentityError> errors) =>
        errors
            .GroupBy(e =>
                e.Code.StartsWith("Password", StringComparison.Ordinal)
                    ? "password"
                    : "user")
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.Description).ToArray());

    private static Exception Invalid(
        IDictionary<string, string[]> errors) =>
        new ValidationException(errors);
}

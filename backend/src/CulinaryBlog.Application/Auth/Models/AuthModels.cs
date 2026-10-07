namespace CulinaryBlog.Application.Auth.Models;

public record RegisterRequest(string FullName, string Email, string UserName, string Password);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record LogoutRequest(string RefreshToken);

/// <summary>
/// PATCH: field nào null thì giữ nguyên. AvatarUrl = "" nghĩa là xóa avatar.
/// </summary>
public record UpdateProfileRequest(string? FullName, string? AvatarUrl);

/// <summary>Thông tin user trả kèm token (FR-AUTH-001).</summary>
public record AuthUserDto(
    string Id,
    string FullName,
    string Email,
    string UserName,
    string? AvatarUrl,
    IReadOnlyList<string> Roles);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt,
    AuthUserDto User);

/// <summary>Hồ sơ đầy đủ cho GET/PATCH /auth/me (FR-AUTH-006). Không chứa dữ liệu nhạy cảm.</summary>
public record UserProfileDto(
    string Id,
    string FullName,
    string Email,
    string UserName,
    string? AvatarUrl,
    IReadOnlyList<string> Roles,
    bool EmailConfirmed,
    DateTimeOffset CreatedAt);
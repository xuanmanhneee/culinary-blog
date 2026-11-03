namespace CulinaryBlog.Application.Users.Models;

/// <summary>Thông tin tài khoản an toàn để quản trị viên xem trong danh sách người dùng.</summary>
public sealed record UserListItemDto(
    string Id,
    string FullName,
    string Email,
    string UserName,
    string? AvatarUrl,
    IReadOnlyList<string> Roles,
    bool EmailConfirmed,
    bool IsActive,
    bool IsLocked,
    DateTimeOffset CreatedAt);

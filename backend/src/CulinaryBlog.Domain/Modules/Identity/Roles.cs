namespace CulinaryBlog.Domain.Modules.Identity;

/// <summary>
/// Tên role dùng chung, tránh hardcode chuỗi (NFR-SEC-006).
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Author = "Author";

    public static readonly string[] All = [Admin, Author];
}
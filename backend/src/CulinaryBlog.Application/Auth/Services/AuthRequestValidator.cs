using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using CulinaryBlog.Application.Auth.Models;

namespace CulinaryBlog.Application.Auth.Services;

/// <summary>
/// Validate cơ bản theo SRS. Độ mạnh mật khẩu do ASP.NET Core Identity kiểm tra (IdentityOptions.Password).
/// Có thể thay bằng FluentValidation mà không đổi AuthService, chỉ cần giữ kiểu trả về.
/// </summary>
internal static class AuthRequestValidator
{
    private static readonly Regex UserNameRegex = new("^[A-Za-z0-9_.-]+$", RegexOptions.Compiled);
    private static readonly EmailAddressAttribute EmailCheck = new();

    public static Dictionary<string, string[]> Validate(RegisterRequest r)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(r.FullName))
            errors["fullName"] = ["Họ tên không được để trống."];

        if (string.IsNullOrWhiteSpace(r.Email) || !EmailCheck.IsValid(r.Email))
            errors["email"] = ["Email không đúng định dạng."];

        if (string.IsNullOrWhiteSpace(r.UserName) || !UserNameRegex.IsMatch(r.UserName.Trim()))
            errors["userName"] = ["Tên đăng nhập chỉ gồm chữ, số và các ký tự _ . -"];

        if (string.IsNullOrEmpty(r.Password))
            errors["password"] = ["Mật khẩu không được để trống."];

        return errors;
    }

    public static Dictionary<string, string[]> Validate(LoginRequest r)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(r.Email) || !EmailCheck.IsValid(r.Email))
            errors["email"] = ["Email không đúng định dạng."];

        if (string.IsNullOrEmpty(r.Password))
            errors["password"] = ["Mật khẩu không được để trống."];

        return errors;
    }

    public static Dictionary<string, string[]> Validate(UpdateProfileRequest r)
    {
        var errors = new Dictionary<string, string[]>();

        if (r.FullName is not null)
        {
            var len = r.FullName.Trim().Length;
            if (len is < 2 or > 100)
                errors["fullName"] = ["Họ tên phải từ 2 đến 100 ký tự."];
        }

        if (!string.IsNullOrEmpty(r.AvatarUrl))
        {
            var ok = Uri.TryCreate(r.AvatarUrl, UriKind.Absolute, out var uri)
                     && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
            if (!ok)
                errors["avatarUrl"] = ["Avatar phải là URL http/https hợp lệ."];
        }

        return errors;
    }
}
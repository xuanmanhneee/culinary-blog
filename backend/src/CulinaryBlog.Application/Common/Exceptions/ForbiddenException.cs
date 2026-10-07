namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// Đã xác thực nhưng không đủ quyền (không phải owner/Admin, tài khoản bị vô hiệu hóa). Map sang HTTP 403.
/// </summary>
public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
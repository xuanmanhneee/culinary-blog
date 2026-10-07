namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// Chưa xác thực hoặc thông tin xác thực sai (sai mật khẩu, token hết hạn/bị thu hồi). Map sang HTTP 401.
/// </summary>
public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// Tài nguyên không tồn tại hoặc đã bị soft-delete. Map sang HTTP 404.
/// </summary>
public sealed class NotFoundException : AppException
{
    public NotFoundException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
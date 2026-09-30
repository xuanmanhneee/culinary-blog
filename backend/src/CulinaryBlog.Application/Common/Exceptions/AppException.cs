namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// Lớp cơ sở cho lỗi phát sinh ở tầng Application (không tìm thấy, xung đột, thiếu quyền...).
/// ErrorCode theo SRS Phụ lục B, được GlobalExceptionMiddleware đưa vào trường "type" của Problem Details.
/// Application không biết HTTP; việc map sang status code do middleware ở tầng API đảm nhiệm.
/// </summary>
public abstract class AppException : Exception
{
    public string ErrorCode { get; }

    protected AppException(string errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }
}
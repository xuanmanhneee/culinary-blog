namespace CulinaryBlog.Domain.Common.Exceptions;

/// <summary>
/// Lớp cơ sở cho mọi lỗi phát sinh bên trong Domain (vi phạm invariant của entity/aggregate).
/// Domain không biết HTTP; GlobalExceptionMiddleware ở tầng API sẽ map sang RFC 7807.
/// </summary>
public abstract class DomainException : Exception
{
    public string ErrorCode { get; }

    protected DomainException(string errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    protected DomainException(string errorCode, string message, Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
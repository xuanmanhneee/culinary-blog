namespace CulinaryBlog.Domain.Common.Exceptions;

/// <summary>
/// Thao tác làm entity rơi vào trạng thái không hợp lệ theo quy tắc nghiệp vụ
/// (ví dụ publish recipe thiếu step/ingredient). Map sang HTTP 400 (SRS Phụ lục A/B).
/// </summary>
public sealed class BusinessRuleViolationException : DomainException
{
    public BusinessRuleViolationException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
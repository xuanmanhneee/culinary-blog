namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// RowVersion không khớp: tài nguyên đã bị request khác cập nhật, client cần tải lại.
/// Map sang HTTP 422 (SRS Phụ lục A/B), khác với 409 của ConflictException.
/// UnitOfWork đổi DbUpdateConcurrencyException của EF Core thành lỗi này.
/// </summary>
public sealed class ConcurrencyConflictException : AppException
{
    public ConcurrencyConflictException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
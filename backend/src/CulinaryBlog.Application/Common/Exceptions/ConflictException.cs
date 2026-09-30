namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// Trùng lặp hoặc xung đột với trạng thái hiện tại (trùng tên/email/slug,
/// xóa category còn recipe...). Map sang HTTP 409.
/// Lỗi RowVersion lệch KHÔNG dùng lớp này, xem ConcurrencyConflictException.
/// </summary>
public sealed class ConflictException : AppException
{
    public ConflictException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
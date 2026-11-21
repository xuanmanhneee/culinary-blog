namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// RowVersion không khớp: tài nguyên đã bị request khác cập nhật, client cần tải lại.
/// Map sang HTTP 409, cùng status với ConflictException nhưng giữ mã lỗi riêng.
/// UnitOfWork đổi DbUpdateConcurrencyException của EF Core thành lỗi này.
/// </summary>
public sealed class ConcurrencyConflictException : AppException
{
    public ConcurrencyConflictException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}

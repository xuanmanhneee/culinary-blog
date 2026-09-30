using CulinaryBlog.Domain.Common.Exceptions;

namespace CulinaryBlog.Application.Common.Exceptions;

/// <summary>
/// Một hoặc nhiều field không hợp lệ (SRS: VALIDATION_ERROR). Map sang HTTP 400,
/// kèm object "errors": { "field": ["msg"] } trong Problem Details.
/// Do ValidationBehavior ném ra sau khi chạy FluentValidation.
/// </summary>
public sealed class ValidationException : AppException
{
    /// <summary>Key là tên field, value là danh sách thông điệp lỗi của field đó.</summary>
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base(ErrorCodes.ValidationError, "One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public ValidationException(string field, string message)
        : this(new Dictionary<string, string[]> { [field] = new[] { message } })
    {
    }
}
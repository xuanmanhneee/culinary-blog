namespace CulinaryBlog.Domain.Common;

/// <summary>
/// Lớp cơ sở cho tất cả các Entity trong hệ thống.
/// Cung cấp: khóa chính UUID, audit fields (CreatedAt/UpdatedAt),
/// Soft Delete flag (IsDeleted) và Optimistic Concurrency Token (RowVersion).
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    /// <summary>
    /// Concurrency token do ứng dụng sinh. PostgreSQL không tự sinh byte[] rowversion
    /// như SQL Server; AuditInterceptor đổi token khi entity được thêm hoặc cập nhật.
    /// </summary>
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

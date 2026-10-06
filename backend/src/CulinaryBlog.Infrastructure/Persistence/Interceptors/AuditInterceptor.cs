using CulinaryBlog.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Metadata;

namespace CulinaryBlog.Infrastructure.Persistence.Interceptors;

/// <summary>
/// EF Core SaveChanges Interceptor: tự động set CreatedAt khi Added,
/// UpdatedAt khi Modified. Áp dụng cho mọi entity kế thừa BaseEntity.
/// </summary>
public class AuditInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
        {
            ApplyAuditInfo(eventData.Context);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
        {
            ApplyAuditInfo(eventData.Context);
        }

        return base.SavingChanges(eventData, result);
    }

    private static void ApplyAuditInfo(DbContext context)
    {
        foreach (EntityEntry<BaseEntity> entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                    RenewConcurrencyToken(entry);
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                    RenewConcurrencyToken(entry);
                    break;
            }
        }
    }

    /// <summary>
    /// Entity cấu hình RowVersion là IsConcurrencyToken (do ứng dụng quản lý, ví dụ Recipe) cần
    /// giá trị mới mỗi lần lưu; WHERE vẫn dùng giá trị cũ nên request đọc bản cũ sẽ bị từ chối.
    /// Entity còn dùng IsRowVersion (DB tự sinh) thì bỏ qua.
    /// </summary>
    private static void RenewConcurrencyToken(EntityEntry<BaseEntity> entry)
    {
        var rowVersion = entry.Property(e => e.RowVersion);
        if (rowVersion.Metadata.IsConcurrencyToken && rowVersion.Metadata.ValueGenerated != ValueGenerated.OnAddOrUpdate)
        {
            rowVersion.CurrentValue = Guid.NewGuid().ToByteArray();
        }
    }
}

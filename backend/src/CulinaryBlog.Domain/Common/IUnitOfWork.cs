namespace CulinaryBlog.Domain.Common;

/// <summary>Đơn vị công việc: gom mọi thay đổi của repository và lưu một lần.</summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
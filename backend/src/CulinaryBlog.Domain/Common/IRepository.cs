namespace CulinaryBlog.Domain.Common;

/// <summary>
/// Interface repository chung, mỗi module implement lại theo nhu cầu riêng.
/// Đặt trong Domain để Application chỉ phụ thuộc vào abstraction (Dependency Rule),
/// Infrastructure là nơi implement cụ thể (EF Core).
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
}

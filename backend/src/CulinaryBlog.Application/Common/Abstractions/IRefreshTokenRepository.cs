namespace CulinaryBlog.Domain.Modules.Identity;

/// <summary>
/// Việc SaveChanges do IUnitOfWork đảm nhiệm, repository chỉ thêm/đọc.
/// Các entity trả về được EF tracking, nên Revoke() sẽ được lưu khi SaveChanges.
/// </summary>
public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);

    Task AddAsync(RefreshToken token, CancellationToken ct = default);

    Task<IReadOnlyList<RefreshToken>> GetActiveByUserAsync(string userId, CancellationToken ct = default);
}
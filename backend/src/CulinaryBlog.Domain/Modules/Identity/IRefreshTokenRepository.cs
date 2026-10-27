namespace CulinaryBlog.Domain.Modules.Identity;

/// <summary>
/// Repository contract for refresh-token persistence.
/// Saving changes is coordinated by <c>IUnitOfWork</c>.
/// </summary>
public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);

    Task AddAsync(RefreshToken token, CancellationToken ct = default);

    Task<IReadOnlyList<RefreshToken>> GetActiveByUserAsync(
        string userId,
        CancellationToken ct = default);
}

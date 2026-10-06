using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Infrastructure.Modules.Identity;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly CulinaryBlogDbContext _db;

    public RefreshTokenRepository(CulinaryBlogDbContext db) => _db = db;

    // Có tracking: Revoke() trên entity trả về sẽ được lưu khi IUnitOfWork.SaveChangesAsync.
    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default) =>
        _db.Set<RefreshToken>().FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);

    public async Task AddAsync(RefreshToken token, CancellationToken ct = default) =>
        await _db.Set<RefreshToken>().AddAsync(token, ct);

    public async Task<IReadOnlyList<RefreshToken>> GetActiveByUserAsync(
        string userId, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;

        // Viết điều kiện tường minh vì thuộc tính tính toán IsActive không dịch được sang SQL.
        return await _db.Set<RefreshToken>()
            .Where(t => t.UserId == userId && t.RevokedAt == null && t.ExpiresAt > now)
            .ToListAsync(ct);
    }
}
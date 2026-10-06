using CulinaryBlog.Application.Common.Abstractions;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Infrastructure.Modules.Identity;

public class UserDirectory : IUserDirectory
{
    private readonly CulinaryBlogDbContext _db;

    public UserDirectory(CulinaryBlogDbContext db) => _db = db;

    public async Task<IReadOnlyDictionary<string, UserSummary>> GetByIdsAsync(
        IEnumerable<string> ids, CancellationToken ct = default)
    {
        var idList = ids.Distinct().ToList();

        return await _db.Set<ApplicationUser>()
            .AsNoTracking()
            .Where(u => idList.Contains(u.Id))
            .Select(u => new UserSummary(u.Id, u.DisplayName, u.AvatarUrl))
            .ToDictionaryAsync(u => u.Id, ct);
    }

    public Task<bool> ExistsAsync(string id, CancellationToken ct = default) =>
        _db.Set<ApplicationUser>().AnyAsync(u => u.Id == id, ct);
}
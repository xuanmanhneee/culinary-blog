namespace CulinaryBlog.Application.Common.Abstractions;

public record UserSummary(string Id, string FullName, string? AvatarUrl);

/// <summary>
/// Điểm nối để module khác (Recipe) lấy thông tin user mà không cần navigation property.
/// Hiện chạy in-process; nếu tách service thì thay bằng HTTP client.
/// </summary>
public interface IUserDirectory
{
    Task<IReadOnlyDictionary<string, UserSummary>> GetByIdsAsync(
        IEnumerable<string> ids, CancellationToken ct = default);

    Task<bool> ExistsAsync(string id, CancellationToken ct = default);
}
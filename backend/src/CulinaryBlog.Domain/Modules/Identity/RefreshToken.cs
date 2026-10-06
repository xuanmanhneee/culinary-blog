namespace CulinaryBlog.Domain.Modules.Identity;

public class RefreshToken
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string UserId { get; private set; } = default!;
    public ApplicationUser? User { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public string? CreatedByIp { get; private set; }

    private RefreshToken() { }

    public static RefreshToken Create(
        string userId,
        string tokenHash,
        DateTimeOffset expiresAt,
        string? createdByIp = null)
    {
        return new RefreshToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            CreatedByIp = createdByIp
        };
    }

    /// <summary>
    /// Thu hồi token. replacedByTokenHash chỉ có giá trị khi token bị thay thế do rotation
    /// (khác với logout, nơi không có token thay thế).
    /// </summary>
    public void Revoke(string? replacedByTokenHash = null)
    {
        if (IsRevoked) return; // không ghi đè thời điểm revoke gốc

        RevokedAt = DateTimeOffset.UtcNow;
        ReplacedByTokenHash = replacedByTokenHash;
    }

    public bool IsRevoked => RevokedAt is not null;
    public bool IsExpired => ExpiresAt <= DateTimeOffset.UtcNow;
    public bool IsActive => !IsRevoked && !IsExpired;
}
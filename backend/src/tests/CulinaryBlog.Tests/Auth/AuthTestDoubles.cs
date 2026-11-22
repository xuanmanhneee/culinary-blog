using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Tests.Auth;

/// <summary>UserManager chạy trong bộ nhớ: chỉ ghi đè các thao tác mà handler thật sự gọi.</summary>
internal sealed class FakeUserManager : UserManager<ApplicationUser>
{
    public ApplicationUser? User { get; set; }
    public string ResetToken { get; set; } = "reset-token";
    public IdentityResult ResetResult { get; set; } = IdentityResult.Success;
    public IdentityResult ChangeResult { get; set; } = IdentityResult.Success;
    public IdentityResult UpdateResult { get; set; } = IdentityResult.Success;
    public bool UserHasPassword { get; set; } = true;
    public int UpdateCalls { get; private set; }
    public string? LastNewPassword { get; private set; }

    public FakeUserManager() : base(new NullStore(), null!, null!, null!, null!, null!, null!, null!, null!) { }

    public override Task<ApplicationUser?> FindByEmailAsync(string email) =>
        Task.FromResult(User is not null && string.Equals(User.Email, email, StringComparison.OrdinalIgnoreCase) ? User : null);

    public override Task<ApplicationUser?> FindByIdAsync(string userId) =>
        Task.FromResult(User is not null && User.Id == userId ? User : null);

    public override Task<string> GeneratePasswordResetTokenAsync(ApplicationUser user) => Task.FromResult(ResetToken);

    public override Task<IdentityResult> ResetPasswordAsync(ApplicationUser user, string token, string newPassword)
    {
        LastNewPassword = newPassword;
        return Task.FromResult(ResetResult);
    }

    public override Task<IdentityResult> ResetAccessFailedCountAsync(ApplicationUser user) =>
        Task.FromResult(IdentityResult.Success);

    public override Task<bool> HasPasswordAsync(ApplicationUser user) => Task.FromResult(UserHasPassword);

    public override Task<IdentityResult> ChangePasswordAsync(ApplicationUser user, string currentPassword, string newPassword)
    {
        LastNewPassword = newPassword;
        return Task.FromResult(ChangeResult);
    }

    public override Task<IdentityResult> UpdateAsync(ApplicationUser user)
    {
        UpdateCalls++;
        return Task.FromResult(UpdateResult);
    }

    public override Task<IList<string>> GetRolesAsync(ApplicationUser user) =>
        Task.FromResult<IList<string>>(["Author"]);

    private sealed class NullStore : IUserStore<ApplicationUser>
    {
        public void Dispose() { }
        public Task<string> GetUserIdAsync(ApplicationUser user, CancellationToken ct) => Task.FromResult(user.Id);
        public Task<string?> GetUserNameAsync(ApplicationUser user, CancellationToken ct) => Task.FromResult(user.UserName);
        public Task SetUserNameAsync(ApplicationUser user, string? userName, CancellationToken ct) => Task.CompletedTask;
        public Task<string?> GetNormalizedUserNameAsync(ApplicationUser user, CancellationToken ct) => Task.FromResult(user.NormalizedUserName);
        public Task SetNormalizedUserNameAsync(ApplicationUser user, string? normalizedName, CancellationToken ct) => Task.CompletedTask;
        public Task<IdentityResult> CreateAsync(ApplicationUser user, CancellationToken ct) => Task.FromResult(IdentityResult.Success);
        public Task<IdentityResult> UpdateAsync(ApplicationUser user, CancellationToken ct) => Task.FromResult(IdentityResult.Success);
        public Task<IdentityResult> DeleteAsync(ApplicationUser user, CancellationToken ct) => Task.FromResult(IdentityResult.Success);
        public Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken ct) => Task.FromResult<ApplicationUser?>(null);
        public Task<ApplicationUser?> FindByNameAsync(string normalizedUserName, CancellationToken ct) => Task.FromResult<ApplicationUser?>(null);
    }
}

internal sealed class FakeRefreshTokens : IRefreshTokenRepository
{
    public List<RefreshToken> Tokens { get; } = [];

    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default) =>
        Task.FromResult(Tokens.FirstOrDefault(token => token.TokenHash == tokenHash));

    public Task AddAsync(RefreshToken token, CancellationToken ct = default)
    {
        Tokens.Add(token);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<RefreshToken>> GetActiveByUserAsync(string userId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<RefreshToken>>(Tokens.Where(token => token.UserId == userId && token.IsActive).ToList());
}

internal sealed class FakeUnitOfWork : IUnitOfWork
{
    public int Saves { get; private set; }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        Saves++;
        return Task.FromResult(1);
    }
}

internal sealed class FakePasswordResetScheduler : IPasswordResetEmailScheduler
{
    public List<(string Email, string FullName, string UserId, string Token)> Sent { get; } = [];

    public void Schedule(string email, string fullName, string userId, string resetToken) =>
        Sent.Add((email, fullName, userId, resetToken));
}

internal sealed class FakeFileDeletionScheduler : IFileDeletionScheduler
{
    public List<string> Deleted { get; } = [];

    public void Schedule(string url) => Deleted.Add(url);
}

internal sealed class FakeFileStorage : IFileStorageService
{
    public string UploadedUrl { get; set; } = "http://storage.test/culinary-blog/recipes/new-avatar.png";
    public List<string> Removed { get; } = [];

    public Task<string> UploadAsync(Guid recipeId, IFormFile file, CancellationToken cancellationToken) =>
        Task.FromResult(UploadedUrl);

    public Task<string> UploadAsync(Guid recipeId, Stream stream, string contentType, string extension, CancellationToken cancellationToken) =>
        Task.FromResult(UploadedUrl);

    public Task<Stream> OpenReadAsync(string url, CancellationToken cancellationToken) =>
        Task.FromResult<Stream>(new MemoryStream());

    public Task DeleteAsync(string url, CancellationToken cancellationToken)
    {
        Removed.Add(url);
        return Task.CompletedTask;
    }
}

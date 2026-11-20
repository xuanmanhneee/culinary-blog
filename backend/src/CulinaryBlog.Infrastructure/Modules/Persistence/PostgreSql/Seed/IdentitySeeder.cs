using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;

public class IdentitySeeder(UserManager<ApplicationUser> users, RoleManager<IdentityRole> roles)
{
    public async Task SeedRolesAsync()
    {
        foreach (var role in Roles.All)
        {
            if (!await roles.RoleExistsAsync(role))
                RequireSuccess(await roles.CreateAsync(new IdentityRole(role)));
        }
    }

    public const string EmailDomain = "culinaryblog.nhom10";
    public const string DefaultPassword = "Author@123";

    /// <summary>Số tài khoản author; số món được chia đều (round-robin) cho từng author.</summary>
    private static readonly string[] AuthorNames =
        ["Bếp Nhà", "Linh Nguyễn", "Minh An", "Bếp Mộc", "Thu Hà"];

    public async Task<IReadOnlyList<ApplicationUser>> SeedDemoAccountsAsync()
    {
        await SeedRolesAsync();
        await GetOrCreateAsync("admin", "Quản trị viên", Roles.Admin);

        var authors = new List<ApplicationUser>();
        for (var index = 0; index < AuthorNames.Length; index++)
            authors.Add(await GetOrCreateAsync($"author{index + 1}", AuthorNames[index], Roles.Author));
        return authors;
    }

    private async Task<ApplicationUser> GetOrCreateAsync(string userName, string displayName, string role)
    {
        var email = $"{userName}@{EmailDomain}";
        var existing = await users.FindByEmailAsync(email);
        if (existing is not null)
            return existing;

        var user = ApplicationUser.Create(displayName, email, userName);
        user.EmailConfirmed = true;
        RequireSuccess(await users.CreateAsync(user, DefaultPassword));
        RequireSuccess(await users.AddToRoleAsync(user, role));
        return user;
    }

    private static void RequireSuccess(IdentityResult result)
    {
        if (!result.Succeeded)
            throw new InvalidOperationException($"Identity seed: {string.Join("; ", result.Errors.Select(error => error.Description))}");
    }
}

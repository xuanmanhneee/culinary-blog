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

    public async Task<IReadOnlyList<ApplicationUser>> SeedDemoAccountsAsync()
    {
        await SeedRolesAsync();
        await GetOrCreateAsync("author1", "Quản trị Bếp Nhà", Roles.Admin);
        return
        [
            await GetOrCreateAsync("author2", "Bếp Nhà", Roles.Author),
            await GetOrCreateAsync("author3", "Linh Nguyễn", Roles.Author),
            await GetOrCreateAsync("author4", "Minh An", Roles.Author),
            await GetOrCreateAsync("author5", "Bếp Mộc", Roles.Author)
        ];
    }

    private async Task<ApplicationUser> GetOrCreateAsync(string userName, string displayName, string role)
    {
        var email = $"{userName}@culinaryblog.local";
        var existing = await users.FindByEmailAsync(email);
        if (existing is not null)
            return existing;

        var user = ApplicationUser.Create(displayName, email, userName);
        user.EmailConfirmed = true;
        RequireSuccess(await users.CreateAsync(user, "Author@123"));
        RequireSuccess(await users.AddToRoleAsync(user, role));
        return user;
    }

    private static void RequireSuccess(IdentityResult result)
    {
        if (!result.Succeeded)
            throw new InvalidOperationException($"Identity seed: {string.Join("; ", result.Errors.Select(error => error.Description))}");
    }
}

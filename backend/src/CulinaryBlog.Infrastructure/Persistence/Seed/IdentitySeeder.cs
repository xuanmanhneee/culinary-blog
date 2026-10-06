using Bogus;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Persistence.Seed;

/// <summary>
/// Seed cho module Identity.
/// - SeedRolesAsync: cần chạy ở MỌI môi trường (register gán role "Author").
/// - SeedAuthorsAsync: chỉ dữ liệu mẫu (author1 là Admin), chỉ nên chạy ở Development.
/// Dùng UserManager để password được hash đúng chuẩn (PBKDF2).
/// </summary>
public class IdentitySeeder
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<IdentitySeeder> _logger;

    public IdentitySeeder(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger<IdentitySeeder> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
    }

    public async Task SeedRolesAsync()
    {
        foreach (var role in Roles.All)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    /// <summary>
    /// Idempotent: user đã tồn tại thì dùng lại, nên luôn trả về đủ danh sách cho RecipeSeeder.
    /// </summary>
    public async Task<List<ApplicationUser>> SeedAuthorsAsync(int count = 5)
    {
        await SeedRolesAsync();

        var faker = new Faker("vi");
        var authors = new List<ApplicationUser>();

        for (var i = 0; i < count; i++)
        {
            var userName = $"author{i + 1}";
            var email = $"author{i + 1}@culinaryblog.local";

            var existing = await _userManager.FindByEmailAsync(email);
            if (existing is not null)
            {
                authors.Add(existing);
                continue;
            }

            var user = ApplicationUser.Create(faker.Name.FullName(), email, userName);
            user.EmailConfirmed = true;
            user.Bio = faker.Lorem.Sentence(12);

            var result = await _userManager.CreateAsync(user, "Author@123");
            if (!result.Succeeded)
            {
                _logger.LogWarning("Không tạo được user {Email}: {Errors}", email,
                    string.Join(", ", result.Errors.Select(e => e.Description)));
                continue;
            }

            await _userManager.AddToRoleAsync(user, i == 0 ? Roles.Admin : Roles.Author);
            authors.Add(user);
        }

        _logger.LogInformation("Identity seed: {Count} author sẵn sàng.", authors.Count);
        return authors;
    }
}
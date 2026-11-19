using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Domain.Modules.Categories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;

public class CategorySeeder(CulinaryBlogDbContext context, ILogger<CategorySeeder> logger)
{
    private static readonly (string Name, string Description)[] Categories =
    [
        ("Món chính", "Các món mặn dùng cùng cơm, từ món kho đến món xào và áp chảo."),
        ("Món canh", "Canh rau, canh củ và canh chua cho bữa cơm hằng ngày."),
        ("Món chay", "Món làm từ rau củ, đậu hũ và nấm."),
        ("Mì - Phở", "Các món mì, bún và phở dùng làm bữa chính."),
        ("Salad", "Rau trộn và gỏi có vị chua ngọt."),
        ("Tráng miệng", "Chè và các món ngọt để dùng sau bữa ăn.")
    ];

    public async Task<IReadOnlyDictionary<string, Category>> SeedAsync()
    {
        var existing = await context.Categories.IgnoreQueryFilters().ToListAsync();
        var bySlug = existing.ToDictionary(category => category.Slug);
        var byName = existing.ToDictionary(category => category.Name);
        var result = new Dictionary<string, Category>();
        var added = 0;

        for (var index = 0; index < Categories.Length; index++)
        {
            var (name, description) = Categories[index];
            var slug = SlugHelper.Generate(name, maxLength: 120);
            if (!bySlug.TryGetValue(slug, out var category) && !byName.TryGetValue(name, out category))
            {
                category = Category.Create(name, slug, description, index);
                context.Categories.Add(category);
                added++;
            }

            if (!category.IsDeleted)
                result.Add(slug, category);
        }

        if (added > 0)
            await context.SaveChangesAsync();

        logger.LogInformation("Category seed: thêm {Count} danh mục.", added);
        return result;
    }
}

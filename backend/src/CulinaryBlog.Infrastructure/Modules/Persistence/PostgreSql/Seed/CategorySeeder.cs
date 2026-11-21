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
        ("Tráng miệng", "Chè và các món ngọt để dùng sau bữa ăn."),
        ("Món kho - rim", "Các món kho, rim đậm đà ăn cùng cơm nóng."),
        ("Hải sản", "Cá, tôm, mực chế biến nhanh gọn và giữ vị tươi."),
        ("Cơm - Cháo", "Cơm chiên, cơm tấm và cháo cho bữa sáng hoặc bữa trưa nhanh."),
        ("Bánh - Ăn vặt", "Bánh mặn, bánh ngọt và món ăn vặt dễ làm tại nhà.")
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

    /// <summary>Danh mục chưa có ảnh dùng ảnh chính của một công thức thuộc danh mục đó (chạy sau khi seed công thức).</summary>
    public async Task AssignImagesFromRecipesAsync()
    {
        var categories = await context.Categories.Where(category => category.ImageUrl == null).ToListAsync();
        var assigned = 0;
        foreach (var category in categories)
        {
            var imageUrl = await context.RecipeImages
                .Where(image => image.IsPrimary && image.Recipe!.CategoryId == category.Id)
                .OrderBy(image => image.Recipe!.Title)
                .Select(image => image.OriginalUrl)
                .FirstOrDefaultAsync();
            if (imageUrl is null) continue;

            category.Update(category.Name, category.Description, imageUrl, category.OrderIndex);
            assigned++;
        }

        if (assigned > 0)
            await context.SaveChangesAsync();

        logger.LogInformation("Category seed: gán ảnh cho {Count} danh mục.", assigned);
    }
}

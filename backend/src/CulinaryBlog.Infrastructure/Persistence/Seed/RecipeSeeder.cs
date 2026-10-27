using Bogus;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Persistence.Seed;

/// <summary>
/// Sinh dữ liệu mẫu cho module Recipes bằng thư viện Bogus.
/// Yêu cầu Lab 2: tối thiểu 100 recipes, mỗi recipe >= 10 ingredients và >= 5 steps.
/// </summary>
public class RecipeSeeder
{
    private readonly CulinaryBlogDbContext _context;
    private readonly ILogger<RecipeSeeder> _logger;

    public RecipeSeeder(CulinaryBlogDbContext context, ILogger<RecipeSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(IReadOnlyList<Category> categories, IReadOnlyList<ApplicationUser> authors, int count = 120)
    {
        if (categories.Count == 0 || authors.Count == 0)
        {
            _logger.LogWarning("Recipe seed: chưa có category hoặc author, bỏ qua.");
            return;
        }

        var usedSlugs = (await _context.Recipes
                .IgnoreQueryFilters()
                .Select(recipe => recipe.Slug)
                .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var missingCount = Math.Max(0, count - usedSlugs.Count);
        if (missingCount == 0)
        {
            _logger.LogInformation("Recipe seed: {Count} recipe đã sẵn sàng, bỏ qua.", usedSlugs.Count);
            return;
        }

        var ingredientFaker = new Faker("vi");
        var recipeFaker = new Faker("vi");
        var recipes = new List<Recipe>();

        for (var i = 0; i < missingCount; i++)
        {
            var category = recipeFaker.PickRandom(categories.ToArray());
            var author = recipeFaker.PickRandom(authors.ToArray());

            var dishName = recipeFaker.Commerce.ProductName(); // dùng làm "chất liệu" tên món cho đa dạng
            var title = $"{recipeFaker.PickRandom(TitlePrefixes)} {dishName}";
            var slug = MakeUniqueSlug(title, usedSlugs);

            var difficulty = recipeFaker.PickRandom<RecipeDifficulty>();
            var status = recipeFaker.Random.WeightedRandom(
                new[] { RecipeStatus.Published, RecipeStatus.Draft, RecipeStatus.Archived },
                new[] { 0.75f, 0.20f, 0.05f });

            var recipe = Recipe.Create(
                title: title,
                slug: slug,
                description: recipeFaker.Lorem.Sentences(2),
                instructions: recipeFaker.Lorem.Paragraph(),
                categoryId: category.Id,
                authorId: author.Id,
                prepTime: recipeFaker.Random.Int(5, 45),
                cookTime: recipeFaker.Random.Int(0, 120),
                servings: recipeFaker.Random.Int(1, 8),
                difficulty: difficulty,
                status: status);

            recipe.SetNutrition(new RecipeNutrition
            {
                Calories = recipeFaker.Random.Decimal(150, 900),
                Protein = recipeFaker.Random.Decimal(2, 60),
                Carbohydrates = recipeFaker.Random.Decimal(5, 120),
                Fat = recipeFaker.Random.Decimal(1, 50),
                Fiber = recipeFaker.Random.Decimal(0, 15),
                Sodium = recipeFaker.Random.Decimal(50, 2000)
            });

            // >= 10 ingredients / recipe (yêu cầu tối thiểu của Lab 2)
            var ingredientCount = ingredientFaker.Random.Int(10, 16);
            for (var j = 0; j < ingredientCount; j++)
            {
                recipe.AddIngredient(
                    name: ingredientFaker.Commerce.ProductMaterial(),
                    quantity: ingredientFaker.Random.Decimal(1, 500),
                    unit: ingredientFaker.PickRandom(Units),
                    notes: ingredientFaker.Random.Bool(0.3f) ? ingredientFaker.Lorem.Word() : null);
            }

            // >= 5 steps / recipe (yêu cầu tối thiểu của Lab 2)
            var stepCount = recipeFaker.Random.Int(5, 8);
            for (var j = 0; j < stepCount; j++)
            {
                recipe.AddStep(
                    title: $"Bước {j + 1}: {recipeFaker.Hacker.Verb()} {recipeFaker.Commerce.ProductAdjective()}",
                    description: recipeFaker.Lorem.Sentences(2),
                    timerMinutes: recipeFaker.Random.Bool(0.5f) ? recipeFaker.Random.Int(1, 30) : null);
            }

            recipe.AddImage(
                originalUrl: $"https://picsum.photos/seed/{slug}/1200/800",
                isPrimary: true,
                altText: title);

            recipes.Add(recipe);
        }

        await _context.Recipes.AddRangeAsync(recipes);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Recipe seed: đã tạo {Count} recipe (tổng ingredients: {Ing}, tổng steps: {Steps}).",
            recipes.Count,
            recipes.Sum(r => r.Ingredients.Count),
            recipes.Sum(r => r.Steps.Count));
    }

    private static string MakeUniqueSlug(string title, HashSet<string> usedSlugs)
    {
        var baseSlug = CategorySeeder.ToSlug(title);
        var slug = baseSlug;
        var suffix = 1;
        while (!usedSlugs.Add(slug))
        {
            slug = $"{baseSlug}-{suffix++}";
        }
        return slug;
    }

    private static readonly string[] TitlePrefixes =
    {
        "Cách làm", "Công thức", "Món", "Bí quyết nấu", "Hướng dẫn làm"
    };

    private static readonly string[] Units =
    {
        "g", "kg", "ml", "l", "thìa cà phê", "thìa canh", "chén", "quả", "củ", "lát", "nhánh"
    };
}

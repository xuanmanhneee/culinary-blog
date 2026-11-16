using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;

/// <summary>
/// Sinh dữ liệu công thức mẫu cho Culinary Blog với 8 món ăn truyền thống Việt Nam.
/// Dữ liệu có thật: tiêu đề, mô tả, nguyên liệu, các bước nấu, dinh dưỡng và ảnh từ Unsplash.
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

    public async Task SeedAsync(IReadOnlyList<Category> categories, IReadOnlyList<ApplicationUser> authors, int count = 8)
    {
        if (categories.Count == 0 || authors.Count == 0)
        {
            _logger.LogWarning("Recipe seed: chưa có category hoặc author, bỏ qua.");
            return;
        }

        // Tự động dọn dẹp các recipe sinh ngẫu nhiên cũ từ Bogus (ảnh picsum.photos) nếu có
        var dummyRecipes = await _context.Recipes
            .Include(r => r.Images)
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .Where(r => r.Images.Any(img => img.OriginalUrl.Contains("picsum.photos")))
            .ToListAsync();

        if (dummyRecipes.Count > 0)
        {
            _logger.LogInformation("Phát hiện {Count} công thức giả cũ (picsum.photos), đang dọn dẹp...", dummyRecipes.Count);
            _context.Recipes.RemoveRange(dummyRecipes);
            await _context.SaveChangesAsync();
        }

        var existingSlugs = (await _context.Recipes
                .IgnoreQueryFilters()
                .Select(recipe => recipe.Slug)
                .ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var recipesToAdd = new List<Recipe>();

        for (var i = 0; i < VietnameseRecipes.Count; i++)
        {
            var item = VietnameseRecipes[i];
            var slug = CategorySeeder.ToSlug(item.Title);

            if (existingSlugs.Contains(slug))
            {
                _logger.LogInformation("Recipe '{Title}' ({Slug}) đã tồn tại, bỏ qua.", item.Title, slug);
                continue;
            }

            var category = ResolveCategory(categories, item.CategoryName, item.FallbackCategoryName);
            var author = authors[i % authors.Count];

            var instructions = string.Join(
                "\n\n",
                item.Steps.Select((step, index) => $"Bước {index + 1}: {step.Title}\n{step.Description}"));

            var recipe = Recipe.Create(
                title: item.Title,
                slug: slug,
                description: item.Description,
                instructions: instructions,
                categoryId: category.Id,
                authorId: author.Id,
                prepTime: item.PrepTime,
                cookTime: item.CookTime,
                servings: item.Servings,
                difficulty: item.Difficulty,
                status: RecipeStatus.Published);

            recipe.SetNutrition(item.Nutrition);

            foreach (var ing in item.Ingredients)
            {
                recipe.AddIngredient(
                    name: ing.Name,
                    quantity: ing.Quantity,
                    unit: ing.Unit,
                    notes: ing.Notes);
            }

            for (var stepIndex = 0; stepIndex < item.Steps.Count; stepIndex++)
            {
                var step = item.Steps[stepIndex];
                recipe.AddStep(
                    title: $"Bước {stepIndex + 1}: {step.Title}",
                    description: step.Description);
            }

            var image = recipe.AddImage(
                originalUrl: item.ImageUrl,
                isPrimary: true,
                altText: item.Title);

            image.SetDerivedUrls(item.ImageUrl, item.ImageUrl);

            recipesToAdd.Add(recipe);
            existingSlugs.Add(slug);
        }

        if (recipesToAdd.Count > 0)
        {
            await _context.Recipes.AddRangeAsync(recipesToAdd);
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation(
            "Recipe seed: đã thêm {Count} món ăn Việt Nam thật (tổng nguyên liệu: {Ing}, tổng bước nấu: {Steps}).",
            recipesToAdd.Count,
            recipesToAdd.Sum(r => r.Ingredients.Count),
            recipesToAdd.Sum(r => r.Steps.Count));
    }

    private static Category ResolveCategory(
        IReadOnlyList<Category> categories,
        string preferredName,
        string? fallbackName = null)
    {
        var found = categories.FirstOrDefault(c => string.Equals(c.Name, preferredName, StringComparison.OrdinalIgnoreCase))
            ?? categories.FirstOrDefault(c => c.Name.Contains(preferredName, StringComparison.OrdinalIgnoreCase));

        if (found != null) return found;

        if (!string.IsNullOrWhiteSpace(fallbackName))
        {
            found = categories.FirstOrDefault(c => string.Equals(c.Name, fallbackName, StringComparison.OrdinalIgnoreCase))
                ?? categories.FirstOrDefault(c => c.Name.Contains(fallbackName, StringComparison.OrdinalIgnoreCase));
            if (found != null) return found;
        }

        return categories[0];
    }

    private sealed record RecipeSeedData(
        string Title,
        string CategoryName,
        string? FallbackCategoryName,
        RecipeDifficulty Difficulty,
        int PrepTime,
        int CookTime,
        int Servings,
        string Description,
        string ImageUrl,
        RecipeNutrition Nutrition,
        List<(string Name, decimal? Quantity, string? Unit, string? Notes)> Ingredients,
        List<(string Title, string Description)> Steps);

    private static readonly List<RecipeSeedData> VietnameseRecipes = new()
    {
        // 1. Phở bò tái chín Hà Nội
        new(
            Title: "Phở bò tái chín Hà Nội",
            CategoryName: "Món chính",
            FallbackCategoryName: "Mì - Phở",
            Difficulty: RecipeDifficulty.Medium,
            PrepTime: 30,
            CookTime: 180,
            Servings: 4,
            Description: "Hương vị truyền thống tinh túy với nước dùng ninh từ xương ống bò suốt nhiều giờ, thơm lừng mùi quế, hồi, thảo quả, ăn kèm bánh phở mềm dai và thịt bò tái chín ngọt mềm.",
            ImageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 550,
                Protein = 32,
                Carbohydrates = 68,
                Fat = 14,
                Fiber = 3,
                Sodium = 1650
            },
            Ingredients: new()
            {
                ("Xương ống bò", 1.5m, "kg", null),
                ("Thịt thăn bò", 300m, "g", null),
                ("Bánh phở tươi", 800m, "g", null),
                ("Quế thanh", 2m, "thanh", null),
                ("Hoa hồi", 3m, "cánh", null),
                ("Hành tây", 1m, "củ", null),
                ("Gừng tươi", 1m, "củ", null),
                ("Hành lá & rau mùi", 100m, "g", null)
            },
            Steps: new()
            {
                ("Sơ chế xương và nướng gia vị", "Rửa sạch xương bò, chần qua nước sôi 5 phút rồi rửa lại cho sạch bọt bẩn. Nướng thơm hành tây, gừng, quế và hoa hồi."),
                ("Ninh nước dùng", "Ninh xương bò với 3 lít nước trong 3 tiếng ở lửa nhỏ, thường xuyên hớt bọt và thả túi gia vị đã nướng vào hầm cùng."),
                ("Hoàn thiện tô phở", "Thái mỏng thịt thăn bò. Chần bánh phở qua nước sôi cho vào tô, xếp thịt bò, hành lá lên trên rồi chan nước dùng đang sôi sùng sục.")
            }
        ),

        // 2. Bánh mì thịt nướng sả ớt
        new(
            Title: "Bánh mì thịt nướng sả ớt",
            CategoryName: "Ăn vặt",
            FallbackCategoryName: "Bánh mì",
            Difficulty: RecipeDifficulty.Easy,
            PrepTime: 25,
            CookTime: 20,
            Servings: 4,
            Description: "Ổ bánh mì giòn rụm kẹp đầy thịt nạc dăm nướng sả ớt thơm phức, quyện cùng đồ chua giòn sần sật, dưa leo tươi mát và nước sốt đậm đà.",
            ImageUrl: "https://images.unsplash.com/photo-1600454021970-351eff4a6554?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 480,
                Protein = 24,
                Carbohydrates = 52,
                Fat = 18,
                Fiber = 4,
                Sodium = 980
            },
            Ingredients: new()
            {
                ("Bánh mì Việt Nam", 4m, "ổ", null),
                ("Thịt nạc dăm heo", 400m, "g", null),
                ("Sả băm", 3m, "cây", null),
                ("Tỏi băm", 3m, "tép", null),
                ("Mật ong", 2m, "muỗng canh", null),
                ("Nước mắm", 2m, "muỗng canh", null),
                ("Đồ chua cà rốt củ cải", 150m, "g", null),
                ("Dưa leo & ngò rí", 100m, "g", null)
            },
            Steps: new()
            {
                ("Ướp thịt nướng", "Thịt nạc dăm thái lát mỏng, ướp với sả băm, tỏi băm, mật ong, nước mắm và dầu hào trong 30 phút cho thấm đều."),
                ("Nướng thịt", "Nướng thịt trên bếp than hoa hoặc nồi chiên không dầu ở 180°C trong 15–20 phút đến khi xém cạnh vàng ươm."),
                ("Kẹp bánh mì hoàn chỉnh", "Rạch dọc ổ bánh mì, phết bơ/pate, xếp thịt nướng, đồ chua, dưa leo, ngò rí và rưới thêm chút nước sốt thịt nướng.")
            }
        ),

        // 3. Tôm sú hấp nước dừa xiêm
        new(
            Title: "Tôm sú hấp nước dừa xiêm",
            CategoryName: "Hải sản",
            FallbackCategoryName: "Món hấp",
            Difficulty: RecipeDifficulty.Easy,
            PrepTime: 15,
            CookTime: 15,
            Servings: 3,
            Description: "Những con tôm sú tươi roi rói đỏ au, giữ trọn vị ngọt tự nhiên quyện cùng hương thơm thanh mát của nước dừa xiêm tươi và sả đập dập.",
            ImageUrl: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 280,
                Protein = 36,
                Carbohydrates = 12,
                Fat = 5,
                Fiber = 1,
                Sodium = 720
            },
            Ingredients: new()
            {
                ("Tôm sú tươi", 500m, "g", null),
                ("Dừa xiêm tươi", 1m, "trái", null),
                ("Sả cây", 4m, "cây", null),
                ("Hành tây", 0.5m, "củ", null),
                ("Ớt sừng", 1m, "trái", null),
                ("Muối tiêu chanh", 1m, "chén", null)
            },
            Steps: new()
            {
                ("Sơ chế tôm và sả", "Tôm sú cắt bỏ bớt râu, rút chỉ đen trên lưng, rửa sạch để ráo. Sả đập dập cắt khúc, hành tây thái múi cau."),
                ("Đun sôi nước dừa", "Đổ nước dừa xiêm vào nồi cùng sả và hành tây, đun sôi bùng lên."),
                ("Hấp tôm", "Cho tôm vào hấp trên lửa lớn khoảng 5–7 phút đến khi vỏ tôm chuyển sang màu đỏ cam đẹp mắt và cong lại thì tắt bếp, bày ra trái dừa.")
            }
        ),

        // 4. Gỏi cuốn tôm thịt nước chấm tương đen
        new(
            Title: "Gỏi cuốn tôm thịt nước chấm tương đen",
            CategoryName: "Món khai vị",
            FallbackCategoryName: "Ăn vặt",
            Difficulty: RecipeDifficulty.Easy,
            PrepTime: 25,
            CookTime: 15,
            Servings: 4,
            Description: "Món khai vị thanh mát, ít dầu mỡ với tôm tươi, thịt ba chỉ luộc, bún tươi và rau sống cuộn chặt trong lớp bánh tráng dẻo dai, chấm cùng tương đậu phộng béo bùi.",
            ImageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 320,
                Protein = 22,
                Carbohydrates = 38,
                Fat = 7,
                Fiber = 3,
                Sodium = 640
            },
            Ingredients: new()
            {
                ("Bánh tráng cuốn", 1m, "xấp", null),
                ("Tôm tươi", 300m, "g", null),
                ("Thịt ba chỉ", 300m, "g", null),
                ("Bún tươi", 300m, "g", null),
                ("Xà lách & rau thơm", 200m, "g", null),
                ("Hẹ lá", 50m, "g", null),
                ("Tương đen & bơ đậu phộng", 100m, "g", null)
            },
            Steps: new()
            {
                ("Sơ chế tôm thịt", "Luộc chín thịt ba chỉ với chút muối, ngâm nước đá rồi thái lát mỏng. Tôm luộc chín, bóc vỏ và chẻ đôi theo chiều dọc."),
                ("Cuộn bánh tráng", "Làm mềm bánh tráng, xếp rau xà lách, rau thơm, bún tươi và thịt ba chỉ lên rồi cuộn một vòng, sau đó xếp tôm và nhánh hẹ vào cuộn chặt tay."),
                ("Pha sốt tương đen", "Phi thơm tỏi, cho tương đen, bơ đậu phộng, chút nước lọc và đường vào khuấy sệt, rắc đậu phộng rang giã dập lên trên.")
            }
        ),

        // 5. Bún chả Hà Nội chuẩn vị
        new(
            Title: "Bún chả Hà Nội chuẩn vị",
            CategoryName: "Món chính",
            FallbackCategoryName: "Món nướng",
            Difficulty: RecipeDifficulty.Medium,
            PrepTime: 30,
            CookTime: 25,
            Servings: 4,
            Description: "Chả viên và thịt ba chỉ nướng than hoa thơm nức mũi, ngập trong bát nước mắm chua ngọt ấm nóng cùng đu đủ xanh giòn giòn và bún rối.",
            ImageUrl: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 620,
                Protein = 35,
                Carbohydrates = 72,
                Fat = 22,
                Fiber = 4,
                Sodium = 1420
            },
            Ingredients: new()
            {
                ("Thịt ba chỉ", 300m, "g", null),
                ("Thịt nạc vai xay", 300m, "g", null),
                ("Bún tươi", 800m, "g", null),
                ("Đu đủ xanh & cà rốt", 200m, "g", null),
                ("Nước mắm ngon", 4m, "muỗng canh", null),
                ("Giấm gạo & đường", 4m, "muỗng canh", null),
                ("Rau sống ăn kèm", 300m, "g", null)
            },
            Steps: new()
            {
                ("Ướp thịt và nặn chả", "Ướp thịt ba chỉ thái miếng và thịt xay (nặn viên tròn dẹt) với hành tím băm, nước mắm, mật ong, tiêu xay trong 30 phút."),
                ("Nướng than hoa", "Nướng chả trên bếp than hoa đến khi vàng xém hai mặt và dậy mùi thơm."),
                ("Pha nước mắm và dùng kèm", "Pha nước chấm theo tỉ lệ 1 mắm : 1 đường : 1 giấm : 4 nước ấm, thả đu đủ và cà rốt tỉa hoa vào. Cho chả nướng vào bát nước chấm và thưởng thức cùng bún.")
            }
        ),

        // 6. Cơm tấm sườn bì chả Sài Gòn
        new(
            Title: "Cơm tấm sườn bì chả Sài Gòn",
            CategoryName: "Món chính",
            FallbackCategoryName: "Đồ ăn sáng",
            Difficulty: RecipeDifficulty.Medium,
            PrepTime: 35,
            CookTime: 30,
            Servings: 4,
            Description: "Đĩa cơm tấm hạt tơi xốp ăn kèm miếng sườn cốt lết nướng mật ong mềm mọng, bì heo thính thơm bùi, chả trứng hấp béo ngậy và mỡ hành xanh mướt.",
            ImageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 780,
                Protein = 42,
                Carbohydrates = 85,
                Fat = 28,
                Fiber = 4,
                Sodium = 1350
            },
            Ingredients: new()
            {
                ("Gạo tấm", 500m, "g", null),
                ("Sườn cốt lết", 4m, "miếng", null),
                ("Bì heo trộn thính", 150m, "g", null),
                ("Trứng vịt", 3m, "quả", null),
                ("Thịt nạc xay", 100m, "g", null),
                ("Mật ong & sữa đặc", 3m, "muỗng canh", null),
                ("Nước mắm kẹo", 1m, "chén", null)
            },
            Steps: new()
            {
                ("Ướp sườn cốt lết", "Dần nhẹ miếng sườn cho mềm, ướp với sả băm, tỏi, mật ong, sữa đặc, nước mắm và dầu hào ít nhất 1 tiếng."),
                ("Hấp chả trứng và nấu cơm", "Hấp chín chả trứng (trộn thịt xay, mộc nhĩ, bún tàu và trứng), quét lòng đỏ trứng lên mặt cho đẹp. Nấu chín gạo tấm."),
                ("Nướng sườn và trình bày", "Nướng sườn trên lửa vừa, phết nước ướp liên tục để thịt không bị khô. Bày cơm ra đĩa cùng sườn, bì, chả, mỡ hành và đồ chua.")
            }
        ),

        // 7. Canh chua cá lóc miền Tây
        new(
            Title: "Canh chua cá lóc miền Tây",
            CategoryName: "Hải sản",
            FallbackCategoryName: "Súp",
            Difficulty: RecipeDifficulty.Easy,
            PrepTime: 20,
            CookTime: 20,
            Servings: 4,
            Description: "Nồi canh chua thanh mát đậm chất sông nước với thịt cá lóc đồng ngọt chắc, vị chua dịu từ me chín, giòn ngon của bạc hà, đậu bắp và thơm lừng rau om, ngò gai.",
            ImageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 260,
                Protein = 30,
                Carbohydrates = 18,
                Fat = 6,
                Fiber = 5,
                Sodium = 1100
            },
            Ingredients: new()
            {
                ("Cá lóc đồng làm sạch", 700m, "g", null),
                ("Me chín", 50m, "g", null),
                ("Dứa/Thơm", 0.25m, "trái", null),
                ("Cà chua", 2m, "trái", null),
                ("Đậu bắp", 100m, "g", null),
                ("Bạc hà/Dọc mùng", 100m, "g", null),
                ("Giá đỗ", 100m, "g", null),
                ("Rau om & ngò gai", 50m, "g", null)
            },
            Steps: new()
            {
                ("Sơ chế cá và cốt me", "Cá lóc cắt khoanh vừa ăn, ướp nhẹ với chút muối và tiêu. Dầm me chín với nước ấm để lọc lấy nước cốt chua."),
                ("Nấu chín cá lóc", "Đun sôi 1.5 lít nước, cho nước cốt me, dứa và cà chua vào nấu sôi, sau đó thả cá lóc vào nấu chín khoảng 10 phút."),
                ("Nấu rau bổi và hoàn tất", "Cho đậu bắp, bạc hà và giá đỗ vào nấu thêm 3 phút, nêm nước mắm, đường cho vừa vị chua ngọt rồi rắc rau om, ngò gai và ớt thái lát lên trên.")
            }
        ),

        // 8. Chè khúc bạch hạnh nhân nhãn lồng
        new(
            Title: "Chè khúc bạch hạnh nhân nhãn lồng",
            CategoryName: "Tráng miệng",
            FallbackCategoryName: "Ăn vặt",
            Difficulty: RecipeDifficulty.Easy,
            PrepTime: 20,
            CookTime: 15,
            Servings: 4,
            Description: "Món tráng miệng giải nhiệt thanh tao với những viên khúc bạch phô mai béo ngậy mềm mịn, nước đường phèn hoa nhài ngọt dịu, nhãn lồng giòn ngọt và hạnh nhân lát rang bùi.",
            ImageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
            Nutrition: new RecipeNutrition
            {
                Calories = 340,
                Protein = 8,
                Carbohydrates = 42,
                Fat = 16,
                Fiber = 2,
                Sodium = 120
            },
            Ingredients: new()
            {
                ("Kem tươi Whipping Cream", 250m, "ml", null),
                ("Sữa tươi không đường", 250m, "ml", null),
                ("Gelatine lá hoặc bột", 15m, "g", null),
                ("Đường phèn", 100m, "g", null),
                ("Nhãn tươi bóc vỏ bỏ hạt", 300m, "g", null),
                ("Hạnh nhân lát rang vàng", 50m, "g", null)
            },
            Steps: new()
            {
                ("Làm thạch khúc bạch", "Ngâm nở gelatine. Đun ấm hỗn hợp sữa tươi, whipping cream và 40g đường phèn (không đun sôi bùng), tắt bếp và cho gelatine vào khuấy tan hoàn toàn."),
                ("Làm lạnh và cắt miếng", "Đổ hỗn hợp ra khuôn, để nguội rồi cho vào ngăn mát tủ lạnh ít nhất 4 tiếng cho đông lại, sau đó cắt miếng vuông vừa ăn."),
                ("Nấu nước đường và trình bày", "Nấu tan 60g đường phèn với 600ml nước lọc, để nguội. Múc khúc bạch, nhãn lồng ra chén, chan nước đường lạnh và rắc hạnh nhân lát rang lên trên.")
            }
        )
    };
}

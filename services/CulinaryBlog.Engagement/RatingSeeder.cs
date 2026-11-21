using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Engagement;

/// <summary>
/// Seed đánh giá mẫu cho môi trường Development. Chạy bằng <c>--seed</c>; kết quả cố định theo id món
/// và chạy lại an toàn: chỉ thay thế đánh giá của các user giả (<see cref="UserPrefix"/>),
/// không đụng tới đánh giá của người dùng thật.
/// </summary>
public static class RatingSeeder
{
    private const string UserPrefix = "seed-user-";
    private const int SeedUserCount = 8;
    private static readonly int[] Scores = [5, 4, 5, 4, 3, 5, 4, 5];

    public static async Task SeedAsync(EngagementDbContext db, RecipeClient recipes, ILogger logger, CancellationToken ct = default)
    {
        var recipeIds = await recipes.GetPublishedIdsAsync(ct);
        if (recipeIds.Count == 0)
        {
            logger.LogWarning("Không lấy được công thức nào từ API chính; hãy seed API chính trước rồi chạy lại.");
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var seeded = new List<RecipeRating>();
        foreach (var recipeId in recipeIds)
        {
            var hash = BitConverter.ToUInt32(recipeId.ToByteArray(), 0);
            if (hash % 4 == 0) continue; // ~25% món chưa có đánh giá để kiểm tra trường hợp ẩn sao.

            var count = 1 + (int)(hash / 4 % 6); // 1–6 lượt đánh giá.
            for (var k = 0; k < count; k++)
            {
                seeded.Add(new RecipeRating
                {
                    UserId = $"{UserPrefix}{(int)((hash + k) % SeedUserCount) + 1}",
                    RecipeId = recipeId,
                    Score = Scores[(int)((hash / 24 + (uint)k * 5) % Scores.Length)],
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Giữ lại đánh giá của người dùng thật: nếu họ đã chấm món nào thì không ghi đè.
        await db.Ratings.Where(rating => rating.UserId.StartsWith(UserPrefix)).ExecuteDeleteAsync(ct);
        db.Ratings.AddRange(seeded);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        logger.LogInformation("Rating seed: {Count} đánh giá mẫu cho {Recipes}/{Total} món.",
            seeded.Count, seeded.Select(x => x.RecipeId).Distinct().Count(), recipeIds.Count);
    }
}

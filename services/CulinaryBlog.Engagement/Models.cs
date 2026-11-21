namespace CulinaryBlog.Engagement;

public sealed class SavedRecipe
{
    public required string UserId { get; init; }
    public Guid RecipeId { get; init; }
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? PrimaryImageUrl { get; set; }
    public int TotalTimeMinutes { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class RecipeRating
{
    public required string UserId { get; init; }
    public Guid RecipeId { get; init; }
    public int Score { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public static bool IsValidScore(int score) => score is >= 1 and <= 5;
}

public sealed record RecipeReferenceRequest(string Slug);
public sealed record RatingRequest(string Slug, int Score);
public sealed record EngagementSummary(Guid RecipeId, double AverageRating, int RatingCount, bool IsSaved, int? MyRating);
public sealed record RatingSummary(Guid RecipeId, double AverageRating, int RatingCount);
public sealed record TopRatedRecipe(Guid RecipeId, double AverageRating, int RatingCount);
public sealed record SavedRecipeDto(Guid RecipeId, string Slug, string Title, string Description, string? PrimaryImageUrl, int TotalTimeMinutes, DateTimeOffset SavedAt);
public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);

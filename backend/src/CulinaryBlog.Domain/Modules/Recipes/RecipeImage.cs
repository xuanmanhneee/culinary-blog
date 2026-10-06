using CulinaryBlog.Domain.Common;

namespace CulinaryBlog.Domain.Modules.Recipes;

public class RecipeImage : BaseEntity
{
    public Guid RecipeId { get; private set; }
    public Recipe? Recipe { get; private set; }

    public string OriginalUrl { get; private set; } = default!;
    public string? MediumUrl { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    public string? AltText { get; private set; }
    public bool IsPrimary { get; private set; }
    public int OrderIndex { get; private set; }

    private RecipeImage() { }

    public static RecipeImage Create(Guid recipeId, string originalUrl, bool isPrimary, int orderIndex, string? altText = null)
    {
        return new RecipeImage
        {
            RecipeId = recipeId,
            OriginalUrl = originalUrl,
            IsPrimary = isPrimary,
            OrderIndex = orderIndex,
            AltText = altText
        };
    }

    /// <summary>Recipe quản lý ảnh chính để luôn chỉ có tối đa một ảnh IsPrimary (FR-RCP-008).</summary>
    internal void SetPrimary(bool isPrimary)
    {
        if (IsPrimary == isPrimary) return;

        IsPrimary = isPrimary;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

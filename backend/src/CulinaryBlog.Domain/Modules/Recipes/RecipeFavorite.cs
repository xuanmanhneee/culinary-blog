using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Identity;

namespace CulinaryBlog.Domain.Modules.Recipes;

/// <summary>
/// Lưu vết công thức nấu ăn yêu thích của người dùng (Saved Recipes / Favorites).
/// </summary>
public class RecipeFavorite : BaseEntity
{
    public Guid RecipeId { get; private set; }
    public Recipe? Recipe { get; private set; }

    public string UserId { get; private set; } = default!;
    public ApplicationUser? User { get; private set; }

    private RecipeFavorite() { }

    public static RecipeFavorite Create(Guid recipeId, string userId)
    {
        return new RecipeFavorite
        {
            RecipeId = recipeId,
            UserId = userId
        };
    }
}

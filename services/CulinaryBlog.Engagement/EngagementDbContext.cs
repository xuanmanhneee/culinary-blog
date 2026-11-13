using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Engagement;

public sealed class EngagementDbContext(DbContextOptions<EngagementDbContext> options) : DbContext(options)
{
    public DbSet<SavedRecipe> SavedRecipes => Set<SavedRecipe>();
    public DbSet<RecipeRating> Ratings => Set<RecipeRating>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SavedRecipe>(entity =>
        {
            entity.ToTable("saved_recipes");
            entity.HasKey(x => new { x.UserId, x.RecipeId });
            entity.Property(x => x.UserId).HasMaxLength(450);
            entity.Property(x => x.Slug).HasMaxLength(200);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.PrimaryImageUrl).HasMaxLength(2048);
            entity.HasIndex(x => new { x.UserId, x.CreatedAt });
        });

        modelBuilder.Entity<RecipeRating>(entity =>
        {
            entity.ToTable("recipe_ratings");
            entity.HasKey(x => new { x.UserId, x.RecipeId });
            entity.Property(x => x.UserId).HasMaxLength(450);
            entity.HasIndex(x => x.RecipeId);
            entity.ToTable(table => table.HasCheckConstraint("CK_recipe_ratings_score", "\"Score\" BETWEEN 1 AND 5"));
        });
    }
}

using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Recipes.Entities;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeImage> RecipeImages => Set<RecipeImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RecipeImage>(entity =>
        {
            entity.HasKey(image => image.Id);
            entity.Property(image => image.OriginalUrl).IsRequired();
            entity.HasOne(image => image.Recipe)
                .WithMany(recipe => recipe.Images)
                .HasForeignKey(image => image.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        base.OnModelCreating(modelBuilder);
    }
}

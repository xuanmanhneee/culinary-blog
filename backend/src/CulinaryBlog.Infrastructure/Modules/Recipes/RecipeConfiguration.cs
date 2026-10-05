using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public class RecipeConfiguration : IEntityTypeConfiguration<Recipe>
{
    public void Configure(EntityTypeBuilder<Recipe> builder)
    {
        builder.ToTable("Recipes");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.Title).HasMaxLength(200).IsRequired();
        builder.HasIndex(r => r.Title).HasDatabaseName("IDX_Recipe_Title");

        builder.Property(r => r.Slug).HasMaxLength(220).IsRequired();
        builder.HasIndex(r => r.Slug).IsUnique().HasDatabaseName("IDX_Recipe_Slug");

        builder.Property(r => r.Description).IsRequired();
        builder.Property(r => r.Instructions).IsRequired();

        builder.Property(r => r.PrepTime).IsRequired();
        builder.Property(r => r.CookTime).IsRequired();
        builder.Property(r => r.Servings).IsRequired();

        builder.Property(r => r.Difficulty).HasConversion<short>().IsRequired();
        builder.HasIndex(r => r.Difficulty).HasDatabaseName("IDX_Recipe_Difficulty");

        builder.Property(r => r.Status).HasConversion<short>().IsRequired();
        builder.HasIndex(r => r.Status).HasDatabaseName("IDX_Recipe_Status");

        builder.Property(r => r.PublishedAt);
        builder.HasIndex(r => r.PublishedAt).HasDatabaseName("IDX_Recipe_PublishedAt");

        builder.Property(r => r.CategoryId).IsRequired();
        builder.HasIndex(r => r.CategoryId).HasDatabaseName("IDX_Recipe_CategoryId");

        builder.Property(r => r.AuthorId).HasMaxLength(450).IsRequired();
        builder.HasIndex(r => r.AuthorId).HasDatabaseName("IDX_Recipe_AuthorId");

        builder.HasOne(r => r.Author)
            .WithMany(u => u.Recipes)
            .HasForeignKey(r => r.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Owned Entity RecipeNutrition -> cột "Nutrition_*" trong bảng Recipes
        builder.OwnsOne(r => r.Nutrition, nutrition =>
        {
            nutrition.Property(n => n.Calories).HasColumnName("Nutrition_Calories").HasColumnType("decimal(8,2)");
            nutrition.Property(n => n.Protein).HasColumnName("Nutrition_Protein").HasColumnType("decimal(8,2)");
            nutrition.Property(n => n.Carbohydrates).HasColumnName("Nutrition_Carbohydrates").HasColumnType("decimal(8,2)");
            nutrition.Property(n => n.Fat).HasColumnName("Nutrition_Fat").HasColumnType("decimal(8,2)");
            nutrition.Property(n => n.Fiber).HasColumnName("Nutrition_Fiber").HasColumnType("decimal(8,2)");
            nutrition.Property(n => n.Sodium).HasColumnName("Nutrition_Sodium").HasColumnType("decimal(8,2)");
        });
        builder.Navigation(r => r.Nutrition).IsRequired();

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.IsDeleted).HasDefaultValue(false);
        builder.HasIndex(r => r.IsDeleted).HasDatabaseName("IDX_Recipe_IsDeleted");
        // PostgreSQL không tự sinh rowversion như SQL Server: cột bytea giữ nguyên giá trị khi UPDATE.
        // Recipe cần optimistic concurrency thật (FR-RCP-004) nên token do ứng dụng sinh
        // (AuditInterceptor đổi giá trị mỗi lần Added/Modified) và EF so sánh trong WHERE.
        builder.Property(r => r.RowVersion)
            .IsConcurrencyToken()
            .HasDefaultValueSql("decode('', 'hex')");

        builder.HasQueryFilter(r => !r.IsDeleted);

        // 1:N child collections, cascade delete
        builder.HasMany(r => r.Steps)
            .WithOne(s => s.Recipe)
            .HasForeignKey(s => s.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Ingredients)
            .WithOne(i => i.Recipe)
            .HasForeignKey(i => i.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Images)
            .WithOne(i => i.Recipe)
            .HasForeignKey(i => i.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        // EF Core cần biết cách "vật chất hóa" các collection private field -> dùng backing field
        builder.Metadata.FindNavigation(nameof(Recipe.Steps))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.Metadata.FindNavigation(nameof(Recipe.Ingredients))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.Metadata.FindNavigation(nameof(Recipe.Images))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}

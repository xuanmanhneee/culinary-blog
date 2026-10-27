using CulinaryBlog.Domain.Modules.Categories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Categories;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.Name).HasMaxLength(100).IsRequired();
        builder.HasIndex(c => c.Name).IsUnique();

        builder.Property(c => c.Slug).HasMaxLength(120).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique().HasDatabaseName("IDX_Category_Slug");

        builder.Property(c => c.Description);
        builder.Property(c => c.ImageUrl).HasMaxLength(500);
        builder.Property(c => c.OrderIndex).HasDefaultValue(0);

        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.IsDeleted).HasDefaultValue(false);
        builder.Property(c => c.RowVersion)
            .IsConcurrencyToken()
            .ValueGeneratedNever();


        builder.HasMany(c => c.Recipes)
            .WithOne(r => r.Category)
            .HasForeignKey(r => r.CategoryId)
            .OnDelete(DeleteBehavior.Restrict); // không xóa Category còn Recipe
    }
}

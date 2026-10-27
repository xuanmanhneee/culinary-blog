using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public class RecipeIngredientConfiguration : IEntityTypeConfiguration<RecipeIngredient>
{
    public void Configure(EntityTypeBuilder<RecipeIngredient> builder)
    {
        builder.ToTable("RecipeIngredients");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.Name).HasMaxLength(200).IsRequired();
        builder.Property(i => i.Quantity).HasColumnType("decimal(10,3)");
        builder.Property(i => i.Unit).HasMaxLength(50);
        builder.Property(i => i.Notes).HasMaxLength(500);
        builder.Property(i => i.OrderIndex).HasDefaultValue(0);

        builder.Property(i => i.CreatedAt).IsRequired();
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);
        builder.Property(i => i.RowVersion)
            .IsConcurrencyToken()
            .ValueGeneratedNever();

    }
}

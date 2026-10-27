using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public class RecipeImageConfiguration : IEntityTypeConfiguration<RecipeImage>
{
    public void Configure(EntityTypeBuilder<RecipeImage> builder)
    {
        builder.ToTable("RecipeImages");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.OriginalUrl).HasMaxLength(500).IsRequired();
        builder.Property(i => i.MediumUrl).HasMaxLength(500);
        builder.Property(i => i.ThumbnailUrl).HasMaxLength(500);
        builder.Property(i => i.AltText).HasMaxLength(200);
        builder.Property(i => i.IsPrimary).HasDefaultValue(false);
        builder.Property(i => i.OrderIndex).HasDefaultValue(0);

        builder.Property(i => i.CreatedAt).IsRequired();
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);
        builder.Property(i => i.RowVersion)
            .IsConcurrencyToken()
            .ValueGeneratedNever();

    }
}

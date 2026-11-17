using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public class RecipeFavoriteConfiguration : IEntityTypeConfiguration<RecipeFavorite>
{
    public void Configure(EntityTypeBuilder<RecipeFavorite> builder)
    {
        builder.ToTable("RecipeFavorites");

        builder.HasKey(rf => rf.Id);
        builder.Property(rf => rf.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(rf => rf.UserId).HasMaxLength(450).IsRequired();
        builder.HasIndex(rf => rf.UserId).HasDatabaseName("IDX_RecipeFavorite_UserId");

        builder.Property(rf => rf.RecipeId).IsRequired();
        builder.HasIndex(rf => rf.RecipeId).HasDatabaseName("IDX_RecipeFavorite_RecipeId");

        builder.HasIndex(rf => new { rf.UserId, rf.RecipeId })
            .IsUnique()
            .HasDatabaseName("IDX_RecipeFavorite_UserId_RecipeId");

        builder.HasOne(rf => rf.Recipe)
            .WithMany()
            .HasForeignKey(rf => rf.RecipeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rf => rf.User)
            .WithMany()
            .HasForeignKey(rf => rf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(rf => rf.CreatedAt).IsRequired();
        builder.Property(rf => rf.IsDeleted).HasDefaultValue(false);
        builder.Property(rf => rf.RowVersion)
            .IsConcurrencyToken()
            .ValueGeneratedNever();
    }
}

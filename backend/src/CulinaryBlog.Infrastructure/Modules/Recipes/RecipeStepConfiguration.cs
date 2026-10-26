using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public class RecipeStepConfiguration : IEntityTypeConfiguration<RecipeStep>
{
    public void Configure(EntityTypeBuilder<RecipeStep> builder)
    {
        builder.ToTable("RecipeSteps");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.StepNumber).IsRequired();
        builder.HasIndex(s => new { s.RecipeId, s.StepNumber }).IsUnique();

        builder.Property(s => s.Title).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Description).IsRequired();
        builder.Property(s => s.TimerMinutes);
        builder.Property(s => s.ImageUrl).HasMaxLength(500);

        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.IsDeleted).HasDefaultValue(false);
        builder.Property(s => s.RowVersion)
            .IsRowVersion()
            .HasDefaultValueSql("decode('', 'hex')");

    }
}

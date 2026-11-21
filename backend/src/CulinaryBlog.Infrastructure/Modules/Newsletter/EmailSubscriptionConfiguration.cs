using CulinaryBlog.Domain.Modules.Newsletter;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CulinaryBlog.Infrastructure.Modules.Newsletter;

public sealed class EmailSubscriptionConfiguration : IEntityTypeConfiguration<EmailSubscription>
{
    public void Configure(EntityTypeBuilder<EmailSubscription> builder)
    {
        builder.ToTable("EmailSubscriptions");
        builder.HasKey(subscription => subscription.Id);
        builder.Property(subscription => subscription.Email).HasMaxLength(320).IsRequired();
        builder.Property(subscription => subscription.NormalizedEmail).HasMaxLength(320).IsRequired();
        builder.HasIndex(subscription => subscription.NormalizedEmail).IsUnique();
        builder.Property(subscription => subscription.RowVersion).IsConcurrencyToken().ValueGeneratedNever();
    }
}

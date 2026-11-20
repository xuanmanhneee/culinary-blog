using CulinaryBlog.Domain.Modules.Newsletter;

namespace CulinaryBlog.Tests.Newsletter;

public sealed class EmailSubscriptionTests
{
    [Fact]
    public void CreateTrimsAndNormalizesEmail()
    {
        var subscription = EmailSubscription.Create("  User@Example.com ");

        Assert.Equal("User@Example.com", subscription.Email);
        Assert.Equal("USER@EXAMPLE.COM", subscription.NormalizedEmail);
    }
}

using CulinaryBlog.Domain.Common;

namespace CulinaryBlog.Domain.Modules.Newsletter;

public sealed class EmailSubscription : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string NormalizedEmail { get; private set; } = default!;

    private EmailSubscription() { }

    public static EmailSubscription Create(string email)
    {
        var trimmed = email.Trim();
        return new EmailSubscription
        {
            Email = trimmed,
            NormalizedEmail = trimmed.ToUpperInvariant()
        };
    }
}

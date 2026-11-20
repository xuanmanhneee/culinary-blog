using System.ComponentModel.DataAnnotations;
using System.Net.Mail;
using CulinaryBlog.Domain.Modules.Newsletter;

namespace CulinaryBlog.Tests.Newsletter;

/// <summary>Email demo dùng tên miền không có dấu chấm (@culinaryblog.nhom10) phải qua được mọi lớp kiểm tra.</summary>
public sealed class SeedAccountEmailTests
{
    [Theory]
    [InlineData("admin@culinaryblog.nhom10")]
    [InlineData("author1@culinaryblog.nhom10")]
    [InlineData("author5@culinaryblog.nhom10")]
    public void SeedAccountEmailsPassBackendValidationAndSmtpAddressParsing(string email)
    {
        Assert.True(new EmailAddressAttribute().IsValid(email));
        Assert.Equal(email, new MailAddress(email).Address);
        Assert.Equal(email.ToUpperInvariant(), EmailSubscription.Create(email).NormalizedEmail);
    }
}

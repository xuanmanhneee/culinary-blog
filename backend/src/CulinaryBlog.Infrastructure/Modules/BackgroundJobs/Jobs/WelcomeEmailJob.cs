using System.Net;
using System.Net.Mail;
using Hangfire;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

public sealed class WelcomeEmailJob
{
    private readonly SmtpOptions _options;

    public WelcomeEmailJob(IOptions<SmtpOptions> options) => _options = options.Value;

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [60, 300, 1800])]
    public async Task SendAsync(string email, string fullName, string userId, string confirmationToken, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient(_options.Host, _options.Port);
        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
            client.EnableSsl = true;
        }

        var confirmationUrl = $"{_options.PublicApiUrl.TrimEnd('/')}/api/v1/auth/confirm-email?userId={Uri.EscapeDataString(userId)}&token={Uri.EscapeDataString(confirmationToken)}";
        using var message = new MailMessage(_options.From, email)
        {
            Subject = "Chào mừng bạn đến với Culinary Blog",
            Body = $"<p>Xin chào {WebUtility.HtmlEncode(fullName)},</p><p>Chào mừng bạn đến với Culinary Blog.</p>",
            IsBodyHtml = true
        };
        message.Body += $"<p><a href=\"{WebUtility.HtmlEncode(confirmationUrl)}\">Confirm email</a></p>";

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message);
    }
}

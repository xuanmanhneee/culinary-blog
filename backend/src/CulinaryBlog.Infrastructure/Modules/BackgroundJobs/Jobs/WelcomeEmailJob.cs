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

        var confirmationUrl = $"{_options.PublicWebUrl.TrimEnd('/')}/confirm-email?userId={Uri.EscapeDataString(userId)}&token={Uri.EscapeDataString(confirmationToken)}";
        var webUrl = _options.PublicWebUrl.TrimEnd('/');
        var body =
            EmailTemplate.Paragraph($"Xin chào <strong>{EmailTemplate.Encode(fullName)}</strong>, chào mừng bạn đến với Bếp Nhà — nơi chia sẻ và khám phá những công thức nấu ăn ngon.") +
            EmailTemplate.Paragraph("Chỉ còn một bước nữa: hãy xác nhận địa chỉ email để hoàn tất tài khoản.") +
            EmailTemplate.Button("Xác nhận email", confirmationUrl) +
            EmailTemplate.FallbackLink(confirmationUrl);

        using var message = new MailMessage(_options.From, email)
        {
            Subject = "Chào mừng bạn đến với Bếp Nhà — xác nhận email của bạn",
            Body = EmailTemplate.Layout(
                "Chào mừng bạn vào bếp!",
                "Xác nhận email để bắt đầu lưu món yêu thích và chia sẻ công thức.",
                body,
                "Bạn nhận email này vì vừa đăng ký tài khoản tại Bếp Nhà.<br>Nếu không phải bạn, hãy bỏ qua email này.",
                webUrl),
            IsBodyHtml = true
        };

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message);
    }
}

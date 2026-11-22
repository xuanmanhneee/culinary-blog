using System.Net;
using System.Net.Mail;
using Hangfire;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

public sealed class PasswordResetEmailJob
{
    private readonly SmtpOptions _options;

    public PasswordResetEmailJob(IOptions<SmtpOptions> options) => _options = options.Value;

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [60, 300, 1800])]
    public async Task SendAsync(string email, string fullName, string userId, string resetToken, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient(_options.Host, _options.Port);
        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
            client.EnableSsl = true;
        }

        var resetUrl = $"{_options.PublicWebUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(resetToken)}";
        var webUrl = _options.PublicWebUrl.TrimEnd('/');
        var body =
            EmailTemplate.Paragraph($"Xin chào <strong>{EmailTemplate.Encode(fullName)}</strong>,") +
            EmailTemplate.Paragraph("Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để chọn mật khẩu mới.") +
            EmailTemplate.Button("Đặt lại mật khẩu", resetUrl) +
            EmailTemplate.FallbackLink(resetUrl);

        using var message = new MailMessage(_options.From, email)
        {
            Subject = "Đặt lại mật khẩu Bếp Nhà",
            Body = EmailTemplate.Layout(
                "Đặt lại mật khẩu",
                "Liên kết đặt lại mật khẩu cho tài khoản Bếp Nhà của bạn.",
                body,
                "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — mật khẩu hiện tại vẫn giữ nguyên.",
                webUrl),
            IsBodyHtml = true
        };

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message);
    }
}

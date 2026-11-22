namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

public sealed class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string From { get; set; } = "noreply@culinaryblog.local";
    public string PublicApiUrl { get; set; } = "http://localhost:5000";
    /// <summary>Địa chỉ công khai của frontend, dùng cho link trong email (xác nhận email, đặt lại mật khẩu).</summary>
    public string PublicWebUrl { get; set; } = "http://localhost:3000";
}

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

public sealed class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string From { get; set; } = "noreply@culinaryblog.local";
    public string PublicApiUrl { get; set; } = "http://localhost:5000";
}

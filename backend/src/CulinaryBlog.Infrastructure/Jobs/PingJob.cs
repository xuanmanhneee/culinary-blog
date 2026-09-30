using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Jobs;

public class PingJob
{
    private readonly ILogger<PingJob> _logger;

    public PingJob(ILogger<PingJob> logger)
    {
        _logger = logger;
    }

    public void Execute(string message)
    {
        _logger.LogInformation("[PingJob] Received: {Message} at {Time}", message, DateTime.UtcNow);
    }
}
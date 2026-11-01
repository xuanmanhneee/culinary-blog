using Hangfire;
using CulinaryBlog.Application.Common.Interfaces;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

public sealed class FileDeletionJob
{
    private readonly IFileStorageService _storage;

    public FileDeletionJob(IFileStorageService storage) => _storage = storage;

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [60, 300, 1800])]
    public Task DeleteAsync(string url, CancellationToken cancellationToken) =>
        _storage.DeleteAsync(url, cancellationToken);
}

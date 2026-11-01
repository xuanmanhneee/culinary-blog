using Hangfire;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

internal sealed class WelcomeEmailScheduler : IWelcomeEmailScheduler
{
    private readonly IBackgroundJobClient _jobs;

    public WelcomeEmailScheduler(IBackgroundJobClient jobs) => _jobs = jobs;

    public void Schedule(string email, string fullName, string userId, string confirmationToken) =>
        _jobs.Enqueue<WelcomeEmailJob>(job => job.SendAsync(email, fullName, userId, confirmationToken, CancellationToken.None));
}

internal sealed class FileDeletionScheduler : IFileDeletionScheduler
{
    private readonly IBackgroundJobClient _jobs;

    public FileDeletionScheduler(IBackgroundJobClient jobs) => _jobs = jobs;

    public void Schedule(string url) =>
        _jobs.Enqueue<FileDeletionJob>(job => job.DeleteAsync(url, CancellationToken.None));
}

internal sealed class ThumbnailScheduler : IThumbnailScheduler
{
    private readonly IBackgroundJobClient _jobs;

    public ThumbnailScheduler(IBackgroundJobClient jobs) => _jobs = jobs;

    public void Schedule(Guid recipeId, Guid imageId, string originalUrl) =>
        _jobs.Enqueue<ThumbnailJob>(job => job.ProcessAsync(recipeId, imageId, originalUrl, CancellationToken.None));
}

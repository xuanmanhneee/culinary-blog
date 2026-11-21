using Hangfire;
using Microsoft.AspNetCore.Builder;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseBackgroundJobs(this WebApplication app)
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = [new AdminDashboardAuthorizationFilter(app.Configuration)]
        });

        RecurringJob.AddOrUpdate<SitemapJob>(
            "sitemap-generation",
            job => job.GenerateAsync(CancellationToken.None),
            Cron.Daily(2),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        RecurringJob.AddOrUpdate<NewsletterDigestJob>(
            "weekly-newsletter",
            job => job.DispatchAsync(CancellationToken.None),
            Cron.Weekly(DayOfWeek.Monday, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        return app;
    }
}

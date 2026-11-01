using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseBackgroundJobs(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseHangfireDashboard("/hangfire", new DashboardOptions
            {
                Authorization = [new AdminDashboardAuthorizationFilter()]
            });
        }

        RecurringJob.AddOrUpdate<SitemapJob>(
            "sitemap-generation",
            job => job.GenerateAsync(CancellationToken.None),
            Cron.Daily(2),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        return app;
    }
}

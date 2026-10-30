using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

public static class BackgroundJobsApplicationBuilderExtensions
{
    public static WebApplication UseBackgroundJobsModule(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseHangfireDashboard("/hangfire");
        }

        app.Lifetime.ApplicationStarted.Register(() =>
        {
            RecurringJob.AddOrUpdate<PingJob>(
                recurringJobId: "ping-every-minute",
                methodCall: job => job.Execute("scheduled ping"),
                cronExpression: "* * * * *");
        });

        return app;
    }
}

using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseBackgroundJobs(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseHangfireDashboard("/hangfire");
        }

        return app;
    }
}

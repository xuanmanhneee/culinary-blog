using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.DependencyInjection;
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

        // Chỉ đăng ký lịch mặc định khi tác vụ chưa tồn tại, để lịch quản trị viên đã đặt không bị ghi đè khi khởi động lại.
        var manager = app.Services.GetRequiredService<IRecurringJobManager>();
        using (var connection = JobStorage.Current.GetConnection())
        {
            var existing = connection.GetRecurringJobs().Select(job => job.Id).ToHashSet();
            foreach (var job in JobCatalog.All.Where(job => !existing.Contains(job.Id)))
            {
                var defaults = job.Defaults;
                job.Register(manager, JobScheduleMath.BuildCron(job.IsWeekly, defaults.DayOfWeek, defaults.Hour, defaults.Minute), JobScheduleMath.Vietnam);
            }
        }

        return app;
    }
}

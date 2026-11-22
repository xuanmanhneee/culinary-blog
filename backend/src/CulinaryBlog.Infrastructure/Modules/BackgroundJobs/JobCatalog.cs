using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;
using Hangfire;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

/// <summary>Một tác vụ định kỳ mà quản trị viên được phép xem, đổi lịch và kích hoạt thủ công.</summary>
public sealed record ManagedJob(
    string Id,
    string Name,
    string Description,
    bool IsWeekly,
    Type JobType,
    string MethodName,
    ScheduleDefaults Defaults,
    Action<IRecurringJobManager, string, TimeZoneInfo> Register,
    Func<IBackgroundJobClient, string> Enqueue,
    Func<IBackgroundJobClient, DateTimeOffset, string> ScheduleAt);

/// <summary>Lịch mặc định theo giờ Việt Nam. <c>DayOfWeek</c> chỉ dùng cho tác vụ hằng tuần.</summary>
public sealed record ScheduleDefaults(DayOfWeek DayOfWeek, int Hour, int Minute);

/// <summary>Danh mục tác vụ nền được quản lý từ trang quản trị. Thêm tác vụ mới chỉ cần thêm một dòng ở đây.</summary>
public static class JobCatalog
{
    public const string NewsletterId = "weekly-newsletter";
    public const string SitemapId = "sitemap-generation";

    public static readonly IReadOnlyList<ManagedJob> All =
    [
        new(
            NewsletterId,
            "Bản tin món ngon hằng tuần",
            "Gửi email top món được chấm điểm cao nhất tới mọi người đã đăng ký nhận thư.",
            IsWeekly: true,
            typeof(NewsletterDigestJob),
            nameof(NewsletterDigestJob.DispatchAsync),
            new ScheduleDefaults(DayOfWeek.Monday, 7, 0),
            (manager, cron, zone) => manager.AddOrUpdate<NewsletterDigestJob>(
                NewsletterId, job => job.DispatchAsync(CancellationToken.None), cron, new RecurringJobOptions { TimeZone = zone }),
            client => client.Enqueue<NewsletterDigestJob>(job => job.DispatchAsync(CancellationToken.None)),
            (client, at) => client.Schedule<NewsletterDigestJob>(job => job.DispatchAsync(CancellationToken.None), at)),
        new(
            SitemapId,
            "Tạo sitemap",
            "Cập nhật sitemap.xml từ các công thức đã xuất bản để công cụ tìm kiếm lập chỉ mục.",
            IsWeekly: false,
            typeof(SitemapJob),
            nameof(SitemapJob.GenerateAsync),
            new ScheduleDefaults(DayOfWeek.Sunday, 9, 0),
            (manager, cron, zone) => manager.AddOrUpdate<SitemapJob>(
                SitemapId, job => job.GenerateAsync(CancellationToken.None), cron, new RecurringJobOptions { TimeZone = zone }),
            client => client.Enqueue<SitemapJob>(job => job.GenerateAsync(CancellationToken.None)),
            (client, at) => client.Schedule<SitemapJob>(job => job.GenerateAsync(CancellationToken.None), at)),
    ];

    public static ManagedJob? Find(string id) => All.FirstOrDefault(job => job.Id == id);
}

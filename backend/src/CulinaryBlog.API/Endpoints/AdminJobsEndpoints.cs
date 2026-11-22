using System.Globalization;
using CulinaryBlog.API.Extensions;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;
using Hangfire;
using Hangfire.Storage;

namespace CulinaryBlog.API.Endpoints;

/// <summary>Quản trị tác vụ nền: xem lịch, đổi lịch, chạy ngay và hẹn giờ một lần (phục vụ demo/báo cáo).</summary>
public static class AdminJobsEndpoints
{
    private const string LocalTimeFormat = "yyyy-MM-dd'T'HH:mm";

    public static IEndpointRouteBuilder MapAdminJobsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("AdminJobs", "admin/jobs")
            .WithTags("AdminJobs")
            .RequireAuthorization(AuthServiceCollectionExtensions.AdminPolicy)
            .ProducesAuthProblems();

        group.MapGet("/", () => Results.Ok(JobCatalog.All.Select(BuildDto).ToList()))
            .WithName("GetManagedJobs")
            .WithSummary("Danh sách tác vụ nền cùng lịch chạy và lần chạy gần nhất")
            .Produces<IReadOnlyList<ManagedJobDto>>();

        group.MapPut("/{id}/schedule", (string id, UpdateScheduleRequest request, IRecurringJobManager manager) =>
        {
            var job = JobCatalog.Find(id);
            if (job is null) return Results.NotFound();

            var errors = new Dictionary<string, string[]>();
            if (request.Hour is < 0 or > 23) errors["hour"] = ["Giờ phải từ 0 đến 23."];
            if (request.Minute is < 0 or > 59) errors["minute"] = ["Phút phải từ 0 đến 59."];
            if (job.IsWeekly && request.DayOfWeek is null or < 0 or > 6) errors["dayOfWeek"] = ["Chọn thứ trong tuần."];
            if (errors.Count > 0) return Results.ValidationProblem(errors, statusCode: StatusCodes.Status422UnprocessableEntity);

            var cron = JobScheduleMath.BuildCron(job.IsWeekly, (DayOfWeek)(request.DayOfWeek ?? 0), request.Hour, request.Minute);
            job.Register(manager, cron, JobScheduleMath.Vietnam);
            return Results.Ok(BuildDto(job));
        })
        .WithName("UpdateManagedJobSchedule")
        .WithSummary("Đổi lịch lặp của tác vụ (giờ Việt Nam)")
        .Produces<ManagedJobDto>()
        .ProducesValidationProblem(StatusCodes.Status422UnprocessableEntity)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{id}/run", (string id, RunJobRequest? request, HttpContext http, IBackgroundJobClient client) =>
        {
            var job = JobCatalog.Find(id);
            if (job is null) return Results.NotFound();

            if (request?.OnlyMe == true)
            {
                if (job.Id != JobCatalog.NewsletterId) return Results.BadRequest(new { error = "Tác vụ này không hỗ trợ gửi thử." });
                var email = http.User.FindFirst("email")?.Value ?? http.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                if (email is null) return Results.Unauthorized();

                client.Enqueue<NewsletterDigestJob>(item => item.SendToAsync(email, CancellationToken.None));
                return Results.Accepted(value: new { message = $"Đã gửi thử bản tin tới {email}." });
            }

            job.Enqueue(client);
            return Results.Accepted(value: new { message = $"Đã đưa \"{job.Name}\" vào hàng đợi." });
        })
        .WithName("RunManagedJobNow")
        .WithSummary("Chạy tác vụ ngay lập tức (onlyMe: chỉ gửi thử cho admin đang đăng nhập)")
        .Produces(StatusCodes.Status202Accepted)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{id}/schedule-once", (string id, ScheduleOnceRequest request, IBackgroundJobClient client) =>
        {
            var job = JobCatalog.Find(id);
            if (job is null) return Results.NotFound();

            if (!DateTime.TryParseExact(request.RunAt, LocalTimeFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var local))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["runAt"] = ["Thời điểm không hợp lệ."] }, statusCode: StatusCodes.Status422UnprocessableEntity);

            var runAt = JobScheduleMath.FromVietnamLocal(local);
            if (runAt <= DateTimeOffset.UtcNow)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["runAt"] = ["Hãy chọn thời điểm ở tương lai."] }, statusCode: StatusCodes.Status422UnprocessableEntity);

            var jobId = job.ScheduleAt(client, runAt);
            return Results.Ok(new ScheduledRunDto(jobId, runAt));
        })
        .WithName("ScheduleManagedJobOnce")
        .WithSummary("Hẹn giờ chạy một lần (giờ Việt Nam, định dạng yyyy-MM-ddTHH:mm)")
        .Produces<ScheduledRunDto>()
        .ProducesValidationProblem(StatusCodes.Status422UnprocessableEntity)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id}/scheduled/{jobId}", (string id, string jobId, IBackgroundJobClient client) =>
        {
            var job = JobCatalog.Find(id);
            if (job is null || !GetScheduledRuns(job).Any(run => run.JobId == jobId)) return Results.NotFound();

            client.Delete(jobId);
            return Results.NoContent();
        })
        .WithName("CancelScheduledManagedJob")
        .WithSummary("Hủy một lần hẹn giờ")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }

    private static ManagedJobDto BuildDto(ManagedJob job)
    {
        using var connection = JobStorage.Current.GetConnection();
        var recurring = connection.GetRecurringJobs().FirstOrDefault(item => item.Id == job.Id);

        JobScheduleMath.ParsedSchedule? schedule = null;
        if (recurring is not null)
        {
            var offset = TimeSpan.Zero;
            try { offset = TimeZoneInfo.FindSystemTimeZoneById(recurring.TimeZoneId ?? "UTC").GetUtcOffset(DateTime.UtcNow); }
            catch (TimeZoneNotFoundException) { }
            schedule = JobScheduleMath.ParseCron(recurring.Cron, offset);
        }

        return new ManagedJobDto(
            job.Id,
            job.Name,
            job.Description,
            job.IsWeekly,
            recurring?.Cron,
            schedule is null ? null : new ScheduleDto((int?)schedule.DayOfWeek, schedule.Hour, schedule.Minute),
            recurring?.NextExecution is { } next ? JobScheduleMath.ToVietnam(next) : null,
            recurring?.LastExecution is { } last ? JobScheduleMath.ToVietnam(last) : null,
            recurring?.LastJobState,
            GetScheduledRuns(job).ToList());
    }

    private static IEnumerable<ScheduledRunDto> GetScheduledRuns(ManagedJob job) =>
        JobStorage.Current.GetMonitoringApi().ScheduledJobs(0, 100)
            .Where(item => item.Value.Job?.Type == job.JobType && item.Value.Job.Method.Name == job.MethodName)
            .Select(item => new ScheduledRunDto(item.Key, JobScheduleMath.ToVietnam(item.Value.EnqueueAt)))
            .OrderBy(run => run.RunAt);

    public sealed record ScheduleDto(int? DayOfWeek, int Hour, int Minute);

    public sealed record ScheduledRunDto(string JobId, DateTimeOffset RunAt);

    public sealed record ManagedJobDto(
        string Id,
        string Name,
        string Description,
        bool IsWeekly,
        string? Cron,
        ScheduleDto? Schedule,
        DateTimeOffset? NextRun,
        DateTimeOffset? LastRun,
        string? LastState,
        IReadOnlyList<ScheduledRunDto> ScheduledRuns);

    public sealed record UpdateScheduleRequest(int? DayOfWeek, int Hour, int Minute);

    public sealed record RunJobRequest(bool OnlyMe);

    public sealed record ScheduleOnceRequest(string RunAt);
}

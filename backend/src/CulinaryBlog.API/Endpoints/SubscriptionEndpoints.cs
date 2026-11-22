using System.ComponentModel.DataAnnotations;
using CulinaryBlog.API.Extensions;
using CulinaryBlog.Domain.Modules.Newsletter;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.API.Endpoints;

public static class SubscriptionEndpoints
{
    public static IEndpointRouteBuilder MapSubscriptionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Subscriptions", "subscriptions")
            .WithTags("Subscriptions")
            .RequireRateLimiting(RateLimitPolicies.Auth);

        group.MapPost("/", async (
            SubscriptionRequest request,
            CulinaryBlogDbContext db,
            IBackgroundJobClient jobs,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || !new EmailAddressAttribute().IsValid(request.Email))
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["email"] = ["Email không đúng định dạng."] });

            var subscription = EmailSubscription.Create(request.Email);
            // shortcut: bản demo đăng ký ngay, thêm double opt-in và unsubscribe trước khi gửi email production.
            if (!await db.EmailSubscriptions.AnyAsync(
                    item => item.NormalizedEmail == subscription.NormalizedEmail,
                    cancellationToken))
            {
                db.EmailSubscriptions.Add(subscription);
                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException)
                {
                    // Hai yêu cầu đăng ký cùng email chạy song song: unique index NormalizedEmail chặn bản thứ hai.
                    return Results.Ok(new { message = "Đăng ký nhận thư thành công. Hãy kiểm tra hộp thư của bạn." });
                }

                jobs.Enqueue<NewsletterDigestJob>(job => job.SendToAsync(subscription.Email, CancellationToken.None));
            }

            return Results.Ok(new { message = "Đăng ký nhận thư thành công. Hãy kiểm tra hộp thư của bạn." });
        })
        .AllowAnonymous()
        .WithName("SubscribeNewsletter")
        .WithSummary("Đăng ký nhận bản tin món ngon hằng tuần")
        .Produces(StatusCodes.Status200OK)
        .ProducesValidationProblem();

        // Quản lý nhận thư của chính người dùng đăng nhập (email lấy từ JWT, không nhận từ client).
        group.MapGet("/me", async (
            HttpContext http,
            CulinaryBlogDbContext db,
            CancellationToken cancellationToken) =>
        {
            var email = GetEmail(http);
            if (email is null) return Results.Unauthorized();

            var normalized = email.Trim().ToUpperInvariant();
            return Results.Ok(new SubscriptionStatus(
                await db.EmailSubscriptions.AnyAsync(item => item.NormalizedEmail == normalized, cancellationToken)));
        })
        .RequireAuthorization()
        .WithName("GetMySubscription")
        .WithSummary("Trạng thái nhận bản tin của tôi")
        .Produces<SubscriptionStatus>()
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPut("/me", async (
            HttpContext http,
            CulinaryBlogDbContext db,
            IBackgroundJobClient jobs,
            CancellationToken cancellationToken) =>
        {
            var email = GetEmail(http);
            if (email is null) return Results.Unauthorized();

            var subscription = EmailSubscription.Create(email);
            if (!await db.EmailSubscriptions.AnyAsync(
                    item => item.NormalizedEmail == subscription.NormalizedEmail,
                    cancellationToken))
            {
                db.EmailSubscriptions.Add(subscription);
                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                    jobs.Enqueue<NewsletterDigestJob>(job => job.SendToAsync(subscription.Email, CancellationToken.None));
                }
                catch (DbUpdateException)
                {
                    // Yêu cầu song song đã tạo bản ghi: kết quả mong muốn vẫn đúng.
                }
            }

            return Results.Ok(new SubscriptionStatus(true));
        })
        .RequireAuthorization()
        .WithName("SubscribeMyEmail")
        .WithSummary("Bật nhận bản tin cho email của tôi")
        .Produces<SubscriptionStatus>()
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/me", async (
            HttpContext http,
            CulinaryBlogDbContext db,
            CancellationToken cancellationToken) =>
        {
            var email = GetEmail(http);
            if (email is null) return Results.Unauthorized();

            var normalized = email.Trim().ToUpperInvariant();
            await db.EmailSubscriptions
                .Where(item => item.NormalizedEmail == normalized)
                .ExecuteDeleteAsync(cancellationToken);
            return Results.Ok(new SubscriptionStatus(false));
        })
        .RequireAuthorization()
        .WithName("UnsubscribeMyEmail")
        .WithSummary("Tắt nhận bản tin cho email của tôi")
        .Produces<SubscriptionStatus>()
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static string? GetEmail(HttpContext http) =>
        http.User.FindFirst("email")?.Value ?? http.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

    public sealed record SubscriptionStatus(bool Subscribed);

    public sealed record SubscriptionRequest(string Email);
}

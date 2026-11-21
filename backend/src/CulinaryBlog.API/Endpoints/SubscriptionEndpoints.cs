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

        return app;
    }

    public sealed record SubscriptionRequest(string Email);
}

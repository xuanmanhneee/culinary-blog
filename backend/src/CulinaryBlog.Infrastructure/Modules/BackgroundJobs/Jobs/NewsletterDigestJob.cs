using System.Net;
using System.Net.Http.Json;
using System.Net.Mail;
using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

public sealed class NewsletterDigestJob
{
    private readonly CulinaryBlogDbContext _db;
    private readonly IHttpClientFactory _clients;
    private readonly IBackgroundJobClient _jobs;
    private readonly SmtpOptions _smtp;

    public NewsletterDigestJob(
        CulinaryBlogDbContext db,
        IHttpClientFactory clients,
        IBackgroundJobClient jobs,
        IOptions<SmtpOptions> smtp) =>
        (_db, _clients, _jobs, _smtp) = (db, clients, jobs, smtp.Value);

    public async Task DispatchAsync(CancellationToken cancellationToken)
    {
        var emails = await _db.EmailSubscriptions.AsNoTracking()
            .Select(subscription => subscription.Email)
            .ToListAsync(cancellationToken);

        foreach (var email in emails)
            _jobs.Enqueue<NewsletterDigestJob>(job => job.SendToAsync(email, CancellationToken.None));
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [60, 300, 1800])]
    public async Task SendToAsync(string email, CancellationToken cancellationToken)
    {
        var topRatings = await _clients.CreateClient("engagement")
            .GetFromJsonAsync<List<TopRating>>("/api/v1/ratings/top?limit=5", cancellationToken) ?? [];
        var recipeIds = topRatings.Select(item => item.RecipeId).ToArray();
        var recipes = await _db.Recipes.AsNoTracking()
            .Where(recipe => recipeIds.Contains(recipe.Id) && recipe.Status == RecipeStatus.Published)
            .Select(recipe => new { recipe.Id, recipe.Title, recipe.Slug })
            .ToListAsync(cancellationToken);

        var recipeById = recipes.ToDictionary(recipe => recipe.Id);
        var items = topRatings.Where(rating => recipeById.ContainsKey(rating.RecipeId)).ToList();
        var webUrl = _smtp.PublicWebUrl.TrimEnd('/');
        string content;
        if (items.Count == 0)
        {
            content =
                EmailTemplate.Paragraph("Tuần này chưa có món nào nhận được đánh giá. Hãy ghé Bếp Nhà, nấu thử một món và là người đầu tiên chấm điểm nhé!") +
                EmailTemplate.Button("Khám phá công thức", $"{webUrl}/recipes");
        }
        else
        {
            var rows = items.Select((rating, index) =>
            {
                var recipe = recipeById[rating.RecipeId];
                return EmailTemplate.RankedItem(
                    index + 1, recipe.Title, $"{webUrl}/recipes/{Uri.EscapeDataString(recipe.Slug)}",
                    rating.AverageRating, rating.RatingCount);
            });
            content =
                EmailTemplate.Paragraph("Đây là những món được cộng đồng Bếp Nhà chấm điểm cao nhất. Chọn một món và vào bếp thôi!") +
                EmailTemplate.RankedList(rows) +
                EmailTemplate.Button("Xem tất cả công thức", $"{webUrl}/recipes");
        }

        var manageUrl = $"{webUrl}/account#settings";
        var body = EmailTemplate.Layout(
            "Món ngon nổi bật tuần này",
            "Top món được chấm điểm cao nhất từ Bếp Nhà.",
            content,
            $"Bạn nhận email này vì đã đăng ký bản tin Bếp Nhà.<br><a href=\"{EmailTemplate.Encode(manageUrl)}\" style=\"color:#b65338;\">Quản lý nhận thư</a> trong Tài khoản → Cài đặt.",
            webUrl);

        using var client = new SmtpClient(_smtp.Host, _smtp.Port);
        if (!string.IsNullOrWhiteSpace(_smtp.Username))
        {
            client.Credentials = new NetworkCredential(_smtp.Username, _smtp.Password);
            client.EnableSsl = true;
        }
        using var message = new MailMessage(_smtp.From, email)
        {
            Subject = "Món ngon nổi bật tuần này từ Bếp Nhà",
            Body = body,
            IsBodyHtml = true
        };
        await client.SendMailAsync(message, cancellationToken);
    }

    private sealed record TopRating(Guid RecipeId, double AverageRating, int RatingCount);
}

using System.Net;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Text;
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
        var body = new StringBuilder("<h2>Top món ngon tuần này</h2>");
        if (items.Count == 0)
        {
            body.Append("<p>Chưa có món nào nhận được đánh giá. Hãy ghé Bếp Nhà và là người đầu tiên chấm điểm nhé.</p>");
        }
        else
        {
            body.Append("<ol>");
            foreach (var rating in items)
            {
                var recipe = recipeById[rating.RecipeId];
                var url = $"{_smtp.PublicApiUrl.TrimEnd('/')}/recipes/{Uri.EscapeDataString(recipe.Slug)}";
                body.Append($"<li><a href=\"{WebUtility.HtmlEncode(url)}\">{WebUtility.HtmlEncode(recipe.Title)}</a> — {rating.AverageRating:0.0}/5 ({rating.RatingCount} lượt)</li>");
            }
            body.Append("</ol>");
        }

        using var client = new SmtpClient(_smtp.Host, _smtp.Port);
        if (!string.IsNullOrWhiteSpace(_smtp.Username))
        {
            client.Credentials = new NetworkCredential(_smtp.Username, _smtp.Password);
            client.EnableSsl = true;
        }
        using var message = new MailMessage(_smtp.From, email)
        {
            Subject = "Món ngon nổi bật tuần này từ Bếp Nhà",
            Body = body.ToString(),
            IsBodyHtml = true
        };
        await client.SendMailAsync(message, cancellationToken);
    }

    private sealed record TopRating(Guid RecipeId, double AverageRating, int RatingCount);
}

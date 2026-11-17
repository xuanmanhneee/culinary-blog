using System.Xml.Linq;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

public sealed class SitemapJob
{
    private readonly CulinaryBlogDbContext _db;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public SitemapJob(CulinaryBlogDbContext db, IWebHostEnvironment environment, IConfiguration configuration)
        => (_db, _environment, _configuration) = (db, environment, configuration);

    [AutomaticRetry(Attempts = 2)]
    [DisableConcurrentExecution(timeoutInSeconds: 900)]
    public async Task GenerateAsync(CancellationToken ct)
    {
        var baseUrl = (_configuration["App:PublicUrl"] ?? "http://localhost:3000").TrimEnd('/');
        var categories = await _db.Categories.AsNoTracking().OrderBy(c => c.Slug)
            .Select(c => new { c.Slug, LastModified = c.UpdatedAt ?? c.CreatedAt }).ToListAsync(ct);
        var recipes = await _db.Recipes.AsNoTracking()
            .Where(r => r.Status == Domain.Modules.Recipes.RecipeStatus.Published)
            .OrderBy(r => r.Slug)
            .Select(r => new { r.Slug, LastModified = r.UpdatedAt ?? r.CreatedAt }).ToListAsync(ct);

        var urls = new[]
            {
                Entry(baseUrl, null, "daily", "1.0"),
                Entry($"{baseUrl}/recipes", null, "daily", "0.9"),
                Entry($"{baseUrl}/categories", null, "weekly", "0.8"),
                Entry($"{baseUrl}/search", null, "weekly", "0.6")
            }
            .Concat(categories.Select(category =>
                Entry($"{baseUrl}/categories/{category.Slug}", category.LastModified, "weekly", "0.7")))
            .Concat(recipes.Select(recipe =>
                Entry($"{baseUrl}/recipes/{recipe.Slug}", recipe.LastModified, "weekly", "0.8")));
        var document = BuildDocument(urls);

        var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        Directory.CreateDirectory(root);
        await File.WriteAllTextAsync(Path.Combine(root, "sitemap.xml"), document.ToString(), ct);
    }

    internal static XDocument BuildDocument(IEnumerable<(
        string Location,
        DateTimeOffset? LastModified,
        string ChangeFrequency,
        string Priority)> urls)
    {
        XNamespace sitemap = "http://www.sitemaps.org/schemas/sitemap/0.9";
        return new XDocument(
            new XElement(sitemap + "urlset",
                urls.Select(entry => new XElement(sitemap + "url",
                    new XElement(sitemap + "loc", entry.Location),
                    entry.LastModified is null ? null : new XElement(sitemap + "lastmod", entry.LastModified.Value.ToString("yyyy-MM-dd")),
                    new XElement(sitemap + "changefreq", entry.ChangeFrequency),
                    new XElement(sitemap + "priority", entry.Priority)))));
    }

    private static (string Location, DateTimeOffset? LastModified, string ChangeFrequency, string Priority) Entry(
        string location,
        DateTimeOffset? lastModified,
        string changeFrequency,
        string priority) => new(location, lastModified, changeFrequency, priority);
}

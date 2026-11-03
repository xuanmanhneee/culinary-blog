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
    public async Task GenerateAsync(CancellationToken ct)
    {
        var baseUrl = (_configuration["App:PublicUrl"] ?? "http://localhost:3000").TrimEnd('/');
        var categories = await _db.Categories.AsNoTracking().OrderBy(c => c.Slug)
            .Select(c => c.Slug).ToListAsync(ct);
        var recipes = await _db.Recipes.AsNoTracking()
            .Where(r => r.Status == Domain.Modules.Recipes.RecipeStatus.Published)
            .OrderBy(r => r.Slug).Select(r => r.Slug).ToListAsync(ct);

        var urls = categories.Select(slug => $"{baseUrl}/categories/{slug}")
            .Concat(recipes.Select(slug => $"{baseUrl}/recipes/{slug}"));
        XNamespace sitemap = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var document = new XDocument(
            new XElement(sitemap + "urlset",
                urls.Select(url => new XElement(sitemap + "url", new XElement(sitemap + "loc", url)))));

        var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        Directory.CreateDirectory(root);
        await File.WriteAllTextAsync(Path.Combine(root, "sitemap.xml"), document.ToString(), ct);
    }
}

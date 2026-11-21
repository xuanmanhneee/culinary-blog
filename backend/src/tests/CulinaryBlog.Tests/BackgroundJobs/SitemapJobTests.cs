using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;
using System.Xml.Linq;

namespace CulinaryBlog.Tests.BackgroundJobs;

public sealed class SitemapJobTests
{
    [Fact]
    public void BuildDocument_WritesSeoMetadataAndCategorySlugUrl()
    {
        var document = SitemapJob.BuildDocument([
            ("https://example.com/categories/mon-viet", new DateTimeOffset(2026, 11, 17, 0, 0, 0, TimeSpan.Zero), "weekly", "0.7")
        ]);
        XNamespace sitemap = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var url = Assert.Single(document.Root!.Elements(sitemap + "url"));

        Assert.Equal("https://example.com/categories/mon-viet", (string?)url.Element(sitemap + "loc"));
        Assert.Equal("2026-11-17", (string?)url.Element(sitemap + "lastmod"));
        Assert.Equal("weekly", (string?)url.Element(sitemap + "changefreq"));
        Assert.Equal("0.7", (string?)url.Element(sitemap + "priority"));
    }
}

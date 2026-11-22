using CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

namespace CulinaryBlog.Tests.BackgroundJobs;

public sealed class EmailTemplateTests
{
    [Fact]
    public void Layout_WrapsContentWithBrandTitleAndFooter()
    {
        var html = EmailTemplate.Layout("Tiêu đề", "Xem trước", "<p>Nội dung</p>", "Chân thư", "https://bepnha.test");

        Assert.Contains("Bếp Nhà", html);
        Assert.Contains(EmailTemplate.Encode("Tiêu đề"), html);
        Assert.Contains("<p>Nội dung</p>", html);
        Assert.Contains("Chân thư", html);
        Assert.Contains("https://bepnha.test", html);
        Assert.Contains(EmailTemplate.Encode("Xem trước"), html);
    }

    [Fact]
    public void Layout_EncodesTitleSoMarkupCannotBeInjected()
    {
        var html = EmailTemplate.Layout("<script>alert(1)</script>", "x", "", "", "https://bepnha.test");

        Assert.DoesNotContain("<script>", html);
        Assert.Contains("&lt;script&gt;", html);
    }

    [Fact]
    public void Button_EncodesUrlAndLabel()
    {
        var html = EmailTemplate.Button("A & B", "https://x.test/?a=1&b=\"2\"");

        Assert.Contains("A &amp; B", html);
        Assert.Contains("a=1&amp;b=&quot;2&quot;", html);
    }

    [Fact]
    public void RankedItem_ShowsRankTitleRatingAndEncodesTitle()
    {
        var html = EmailTemplate.RankedItem(1, "Phở <bò>", "https://x.test/recipes/pho", 4.6, 12);

        Assert.Contains(EmailTemplate.Encode("Phở <bò>"), html);
        Assert.DoesNotContain("<bò>", html);
        Assert.Contains("4.6/5", html);
        Assert.Contains("12 lượt", html);
        Assert.Contains("★★★★★", html);
    }

    [Fact]
    public void RankedItem_StarsRoundAndStayWithinFive()
    {
        Assert.Contains("★★★☆☆", EmailTemplate.RankedItem(2, "Món", "https://x.test", 3.2, 1));
        Assert.Contains("★★★★★", EmailTemplate.RankedItem(2, "Món", "https://x.test", 9, 1));
    }
}

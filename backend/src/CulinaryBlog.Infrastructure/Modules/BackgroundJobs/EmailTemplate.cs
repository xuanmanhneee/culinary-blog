using System.Net;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

/// <summary>
/// Khung HTML dùng chung cho mọi email của Bếp Nhà. Dùng bảng và CSS inline vì phần lớn
/// ứng dụng mail (Gmail, Outlook) bỏ qua thẻ &lt;style&gt; và không hỗ trợ flex/grid.
/// </summary>
public static class EmailTemplate
{
    private const string Primary = "#1f4b3f";
    private const string Accent = "#b65338";
    private const string Page = "#f4eee6";
    private const string Card = "#fffdf9";
    private const string Text = "#2e2925";
    private const string Muted = "#70675f";
    private const string Border = "#ded4c8";
    private const string Font = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    public static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    /// <param name="preheader">Dòng xem trước hiện cạnh tiêu đề trong hộp thư.</param>
    /// <param name="bodyHtml">Nội dung chính (đã mã hóa HTML ở nơi gọi).</param>
    /// <param name="footerHtml">Dòng chú thích cuối thư.</param>
    public static string Layout(string title, string preheader, string bodyHtml, string footerHtml, string siteUrl) => $"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>{Encode(title)}</title>
        </head>
        <body style="margin:0;padding:0;background:{Page};font-family:{Font};color:{Text};">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{Encode(preheader)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{Page};padding:32px 12px;">
            <tr><td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                <tr><td style="padding:0 0 16px 4px;">
                  <a href="{Encode(siteUrl)}" style="text-decoration:none;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:{Primary};">🍲 Bếp Nhà</a>
                </td></tr>
                <tr><td style="background:{Card};border:1px solid {Border};border-radius:16px;padding:32px 28px;">
                  <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;letter-spacing:-0.5px;color:{Primary};">{Encode(title)}</h1>
                  {bodyHtml}
                </td></tr>
                <tr><td style="padding:20px 8px 0;text-align:center;font-size:12px;line-height:1.7;color:{Muted};">
                  {footerHtml}
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    public static string Paragraph(string html) =>
        $"<p style=\"margin:0 0 16px;font-size:15px;line-height:1.7;color:{Text};\">{html}</p>";

    /// <summary>Nút bấm dạng bảng để hiển thị đúng cả trên Outlook.</summary>
    public static string Button(string label, string url) => $"""
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr>
          <td style="background:{Primary};border-radius:999px;">
            <a href="{Encode(url)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">{Encode(label)}</a>
          </td>
        </tr></table>
        """;

    /// <summary>Ghi chú nhỏ kèm đường link dự phòng khi nút không bấm được.</summary>
    public static string FallbackLink(string url) =>
        $"<p style=\"margin:0;font-size:12px;line-height:1.6;color:{Muted};word-break:break-all;\">Nếu nút không hoạt động, hãy dán đường dẫn này vào trình duyệt:<br><a href=\"{Encode(url)}\" style=\"color:{Accent};\">{Encode(url)}</a></p>";

    /// <summary>Một dòng trong danh sách xếp hạng món ăn.</summary>
    public static string RankedItem(int rank, string title, string url, double average, int count) => $"""
        <tr>
          <td width="44" valign="top" style="padding:14px 0;border-top:1px solid {Border};">
            <div style="width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:{(rank == 1 ? Accent : "#e4eee7")};color:{(rank == 1 ? "#ffffff" : Primary)};font-weight:700;font-size:14px;">{rank}</div>
          </td>
          <td valign="top" style="padding:14px 0;border-top:1px solid {Border};">
            <a href="{Encode(url)}" style="font-size:16px;font-weight:600;color:{Text};text-decoration:none;">{Encode(title)}</a>
            <div style="margin-top:4px;font-size:13px;color:{Muted};"><span style="color:{Accent};">{Stars(average)}</span> {average:0.0}/5 · {count} lượt đánh giá</div>
          </td>
        </tr>
        """;

    public static string RankedList(IEnumerable<string> rows) =>
        $"<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 20px;\">{string.Concat(rows)}</table>";

    private static string Stars(double average)
    {
        var full = (int)Math.Round(Math.Clamp(average, 0, 5), MidpointRounding.AwayFromZero);
        return new string('★', full) + new string('☆', 5 - full);
    }
}

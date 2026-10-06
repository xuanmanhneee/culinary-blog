using System.Globalization;
using System.Text;

namespace CulinaryBlog.Application.Common.Helpers;

/// <summary>
/// Sinh slug URL-friendly từ tiêu đề tiếng Việt: "Phở Bò Hà Nội" → "pho-bo-ha-noi".
/// </summary>
public static class SlugHelper
{
    public static string Generate(string text, int maxLength = 220)
    {
        // Tách dấu ra khỏi ký tự gốc (FormD) rồi bỏ dấu; "đ" không tách được nên đổi tay.
        var normalized = text.Trim().ToLowerInvariant()
            .Replace('đ', 'd')
            .Normalize(NormalizationForm.FormD);

        var builder = new StringBuilder(normalized.Length);
        var pendingDash = false;

        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
                continue;

            if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                if (pendingDash && builder.Length > 0) builder.Append('-');
                builder.Append(c);
                pendingDash = false;
            }
            else
            {
                pendingDash = true;
            }
        }

        var slug = builder.ToString();
        return slug.Length <= maxLength ? slug : slug[..maxLength].TrimEnd('-');
    }
}

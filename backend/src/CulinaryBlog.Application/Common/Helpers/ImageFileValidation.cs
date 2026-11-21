using CulinaryBlog.Application.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Application.Common.Helpers;

public static class ImageFileValidation
{
    public const long MaxFileSize = 5 * 1024 * 1024;
    public static readonly IReadOnlySet<string> AllowedContentTypes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "image/avif"
        };

    public static async Task ValidateMagicBytesAsync(IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var bytes = new byte[12];
        var read = 0;
        while (read < bytes.Length)
        {
            var count = await stream.ReadAsync(bytes.AsMemory(read, bytes.Length - read), cancellationToken);
            if (count == 0) break;
            read += count;
        }

        var valid = file.ContentType.ToLowerInvariant() switch
        {
            "image/jpeg" => read >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
            "image/png" => read >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/webp" => read >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            "image/avif" => read >= 12 && bytes.AsSpan(4, 4).SequenceEqual("ftyp"u8) &&
                (bytes.AsSpan(8, 4).SequenceEqual("avif"u8) || bytes.AsSpan(8, 4).SequenceEqual("avis"u8)),
            _ => false
        };

        if (!valid)
            throw new ValidationException(nameof(file), "Nội dung tệp không đúng định dạng ảnh đã khai báo.");
    }
}

using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Tests.Categories;

public sealed class ImageFileValidationTests
{
    [Fact]
    public async Task ValidateMagicBytesAsync_accepts_png_signature()
    {
        var file = CreateFile(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, "image/png");

        await ImageFileValidation.ValidateMagicBytesAsync(file, CancellationToken.None);
    }

    [Fact]
    public async Task ValidateMagicBytesAsync_rejects_spoofed_image()
    {
        var file = CreateFile("not an image"u8.ToArray(), "image/png");

        await Assert.ThrowsAsync<ValidationException>(() =>
            ImageFileValidation.ValidateMagicBytesAsync(file, CancellationToken.None));
    }

    private static FormFile CreateFile(byte[] bytes, string contentType) =>
        new(new MemoryStream(bytes), 0, bytes.Length, "file", "image.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
}

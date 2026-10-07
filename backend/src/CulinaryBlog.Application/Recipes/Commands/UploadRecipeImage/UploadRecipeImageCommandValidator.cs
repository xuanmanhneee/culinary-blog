using System.IO;
using FluentValidation;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public sealed class UploadRecipeImageCommandValidator : AbstractValidator<UploadRecipeImageCommand>
{
    private const long MaxFileSize = 5 * 1024 * 1024;

    public UploadRecipeImageCommandValidator()
    {
        RuleFor(x => x.RecipeId).NotEmpty();
        RuleFor(x => x.File)
            .NotNull()
            .Must(file => file is not null && file.Length > 0)
            .WithMessage("An image file is required.")
            .Must(file => file is not null && file.Length <= MaxFileSize)
            .WithMessage("The image must not exceed 5 MB.")
            .Must(file => file is not null && AllowedContentTypes.Contains(file.ContentType))
            .WithMessage("Only JPEG, PNG, WebP, and AVIF images are supported.");
    }

    internal static readonly System.Collections.Generic.IReadOnlySet<string> AllowedContentTypes =
        new System.Collections.Generic.HashSet<string>(System.StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "image/avif"
        };
}

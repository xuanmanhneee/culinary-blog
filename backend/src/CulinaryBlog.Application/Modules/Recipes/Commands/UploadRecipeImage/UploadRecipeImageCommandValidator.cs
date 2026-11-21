using CulinaryBlog.Application.Common.Helpers;
using FluentValidation;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public sealed class UploadRecipeImageCommandValidator : AbstractValidator<UploadRecipeImageCommand>
{
    public UploadRecipeImageCommandValidator()
    {
        RuleFor(x => x.RecipeId).NotEmpty();
        RuleFor(x => x.File)
            .NotNull()
            .Must(file => file is not null && file.Length > 0)
            .WithMessage("An image file is required.")
            .Must(file => file is not null && file.Length <= ImageFileValidation.MaxFileSize)
            .WithMessage("The image must not exceed 5 MB.")
            .Must(file => file is not null && ImageFileValidation.AllowedContentTypes.Contains(file.ContentType))
            .WithMessage("Only JPEG, PNG, WebP, and AVIF images are supported.");
    }
}

using CulinaryBlog.Application.Common.Helpers;
using FluentValidation;

namespace CulinaryBlog.Application.Categories.Commands.UploadCategoryImage;

public sealed class UploadCategoryImageCommandValidator : AbstractValidator<UploadCategoryImageCommand>
{
    public UploadCategoryImageCommandValidator()
    {
        RuleFor(command => command.CategoryId).NotEmpty();
        RuleFor(command => command.File)
            .NotNull()
            .Must(file => file is not null && file.Length > 0)
            .WithMessage("Vui lòng chọn ảnh.")
            .Must(file => file is not null && file.Length <= ImageFileValidation.MaxFileSize)
            .WithMessage("Ảnh không được vượt quá 5 MB.")
            .Must(file => file is not null && ImageFileValidation.AllowedContentTypes.Contains(file.ContentType))
            .WithMessage("Chỉ hỗ trợ JPEG, PNG, WebP và AVIF.");
    }
}

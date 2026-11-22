using CulinaryBlog.Application.Common.Helpers;
using FluentValidation;

namespace CulinaryBlog.Application.Categories.Commands.CreateCategory;

public sealed class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(command => command.Request.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Tên danh mục là bắt buộc.")
            .Must(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length >= 2)
            .WithMessage("Tên danh mục phải có ít nhất 2 ký tự.")
            .Must(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length <= 100)
            .WithMessage("Tên danh mục tối đa 100 ký tự.")
            .Must((command, name) => !string.IsNullOrWhiteSpace(command.Request.Slug) || SlugHelper.Generate(name).Length > 0)
            .WithMessage("Tên danh mục cần chứa chữ cái Latin hoặc chữ số để tạo đường dẫn.")
            .OverridePropertyName("name");

        RuleFor(command => command.Request.Slug)
            .Must(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length <= 120)
            .WithMessage("Slug tối đa 120 ký tự.")
            .OverridePropertyName("slug");

        RuleFor(command => command.Request.OrderIndex)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị không được âm.")
            .OverridePropertyName("orderIndex");
    }
}

using FluentValidation;

namespace CulinaryBlog.Application.Categories.Commands.CreateCategory;

public sealed class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(command => command.Request.Name)
            .NotEmpty().WithMessage("Tên danh mục là bắt buộc.")
            .Must(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length <= 100)
            .WithMessage("Tên danh mục tối đa 100 ký tự.")
            .OverridePropertyName("name");

        RuleFor(command => command.Request.Slug)
            .NotEmpty().WithMessage("Slug là bắt buộc.")
            .Must(value => string.IsNullOrWhiteSpace(value) || value.Trim().Length <= 120)
            .WithMessage("Slug tối đa 120 ký tự.")
            .OverridePropertyName("slug");

        RuleFor(command => command.Request.OrderIndex)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị không được âm.")
            .OverridePropertyName("orderIndex");
    }
}

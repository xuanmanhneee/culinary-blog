using FluentValidation;

namespace CulinaryBlog.Application.Categories.Commands.UpdateCategory;

public sealed class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(command => command.Request.Name)
            .NotEmpty().WithMessage("Tên danh mục là bắt buộc.")
            .Must(value => value.Trim().Length <= 100)
            .WithMessage("Tên danh mục tối đa 100 ký tự.")
            .OverridePropertyName("name");

        RuleFor(command => command.Request.ImageUrl)
            .Must(value => string.IsNullOrWhiteSpace(value) || Uri.TryCreate(value, UriKind.Absolute, out _))
            .WithMessage("ImageUrl phải là URL hợp lệ.")
            .OverridePropertyName("imageUrl");

        RuleFor(command => command.Request.OrderIndex)
            .GreaterThanOrEqualTo(0)
            .When(command => command.Request.OrderIndex.HasValue)
            .WithMessage("Thứ tự hiển thị không được âm.")
            .OverridePropertyName("orderIndex");
    }
}

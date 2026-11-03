using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using FluentValidation;

namespace CulinaryBlog.Application.Auth.Commands.Register;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    private static readonly Regex UserNameRegex = new("^[A-Za-z0-9_.-]+$", RegexOptions.Compiled);
    private static readonly EmailAddressAttribute EmailCheck = new();

    public RegisterCommandValidator()
    {
        RuleFor(command => command.Request.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .OverridePropertyName("fullName");

        RuleFor(command => command.Request.Email)
            .Must(email => !string.IsNullOrWhiteSpace(email) && EmailCheck.IsValid(email))
            .WithMessage("Email không đúng định dạng.")
            .OverridePropertyName("email");

        RuleFor(command => command.Request.UserName)
            .Must(userName => !string.IsNullOrWhiteSpace(userName) && UserNameRegex.IsMatch(userName.Trim()))
            .WithMessage("Tên đăng nhập chỉ gồm chữ, số và các ký tự _ . -")
            .OverridePropertyName("userName");

        RuleFor(command => command.Request.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .OverridePropertyName("password");
    }
}

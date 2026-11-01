using System.ComponentModel.DataAnnotations;
using FluentValidation;

namespace CulinaryBlog.Application.Auth.Commands.Login;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    private static readonly EmailAddressAttribute EmailCheck = new();

    public LoginCommandValidator()
    {
        RuleFor(command => command.Request.Email)
            .Must(email => !string.IsNullOrWhiteSpace(email) && EmailCheck.IsValid(email))
            .WithMessage("Email không đúng định dạng.")
            .OverridePropertyName("email");

        RuleFor(command => command.Request.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .OverridePropertyName("password");
    }
}

using FluentValidation;

namespace CulinaryBlog.Application.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator() =>
        RuleFor(command => command.Request.IdToken)
            .NotEmpty()
            .WithMessage("Google ID token is required.")
            .OverridePropertyName("idToken");
}

using FluentValidation;

namespace CulinaryBlog.Application.Auth.Commands.UpdateCurrentUser;

public sealed class UpdateCurrentUserCommandValidator : AbstractValidator<UpdateCurrentUserCommand>
{
    public UpdateCurrentUserCommandValidator()
    {
        RuleFor(command => command.Request.FullName)
            .Must(fullName => fullName is null || fullName.Trim().Length is >= 2 and <= 100)
            .WithMessage("Họ tên phải từ 2 đến 100 ký tự.")
            .OverridePropertyName("fullName");

        RuleFor(command => command.Request.AvatarUrl)
            .Must(BeValidAvatarUrl)
            .WithMessage("Avatar phải là URL http/https hợp lệ.")
            .OverridePropertyName("avatarUrl");
    }

    private static bool BeValidAvatarUrl(string? avatarUrl)
    {
        if (string.IsNullOrEmpty(avatarUrl))
        {
            return true;
        }

        return Uri.TryCreate(avatarUrl, UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}

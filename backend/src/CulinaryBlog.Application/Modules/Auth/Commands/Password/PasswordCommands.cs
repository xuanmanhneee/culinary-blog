using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Auth.Commands.Password;

public sealed record ForgotPasswordCommand(ForgotPasswordRequest Request) : IRequest;

public sealed record ResetPasswordCommand(ResetPasswordRequest Request) : IRequest;

public sealed record ChangePasswordCommand(string UserId, ChangePasswordRequest Request) : IRequest;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator() =>
        RuleFor(c => c.Request.Email).NotEmpty().EmailAddress()
            .WithMessage("Email không đúng định dạng.").OverridePropertyName("email");
}

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(c => c.Request.Email).NotEmpty().EmailAddress()
            .WithMessage("Email không đúng định dạng.").OverridePropertyName("email");
        RuleFor(c => c.Request.Token).NotEmpty()
            .WithMessage("Liên kết đặt lại mật khẩu không hợp lệ.").OverridePropertyName("token");
        RuleFor(c => c.Request.NewPassword).NotEmpty()
            .WithMessage("Mật khẩu mới không được để trống.").OverridePropertyName("password");
    }
}

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(c => c.Request.CurrentPassword).NotEmpty()
            .WithMessage("Mật khẩu hiện tại không được để trống.").OverridePropertyName("currentPassword");
        RuleFor(c => c.Request.NewPassword).NotEmpty()
            .WithMessage("Mật khẩu mới không được để trống.").OverridePropertyName("password");
    }
}

/// <summary>Luôn thành công kể cả khi email không tồn tại để không lộ danh sách tài khoản.</summary>
internal sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IPasswordResetEmailScheduler _scheduler;

    public ForgotPasswordCommandHandler(UserManager<ApplicationUser> users, IPasswordResetEmailScheduler scheduler) =>
        (_users, _scheduler) = (users, scheduler);

    public async Task Handle(ForgotPasswordCommand command, CancellationToken ct)
    {
        var user = await _users.FindByEmailAsync(command.Request.Email.Trim());
        if (user is null || !user.IsActive) return;

        var token = await _users.GeneratePasswordResetTokenAsync(user);
        _scheduler.Schedule(user.Email!, user.DisplayName, user.Id, token);
    }
}

internal sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;

    public ResetPasswordCommandHandler(UserManager<ApplicationUser> users, IRefreshTokenRepository tokens, IUnitOfWork unitOfWork) =>
        (_users, _tokens, _unitOfWork) = (users, tokens, unitOfWork);

    public async Task Handle(ResetPasswordCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var user = await _users.FindByEmailAsync(request.Email.Trim());
        if (user is null || !user.IsActive) throw InvalidLink();

        var result = await _users.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == nameof(IdentityErrorDescriber.InvalidToken))) throw InvalidLink();
            throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(result.Errors));
        }

        await _users.ResetAccessFailedCountAsync(user);
        await AuthUseCaseSupport.RevokeAllAsync(user.Id, _tokens, _unitOfWork, ct);
    }

    private static Common.Exceptions.ValidationException InvalidLink() =>
        AuthUseCaseSupport.Invalid(new Dictionary<string, string[]>
        {
            ["token"] = ["Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."]
        });
}

internal sealed class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;

    public ChangePasswordCommandHandler(UserManager<ApplicationUser> users, IRefreshTokenRepository tokens, IUnitOfWork unitOfWork) =>
        (_users, _tokens, _unitOfWork) = (users, tokens, unitOfWork);

    public async Task Handle(ChangePasswordCommand command, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(command.UserId)
                   ?? throw new UnauthorizedException(ErrorCodes.AuthUnauthorized, "Phiên đăng nhập không hợp lệ.");

        var request = command.Request;
        if (!await _users.HasPasswordAsync(user))
        {
            throw AuthUseCaseSupport.Invalid(new Dictionary<string, string[]>
            {
                ["currentPassword"] = ["Tài khoản đăng nhập bằng Google chưa có mật khẩu để đổi."]
            });
        }

        var result = await _users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == nameof(IdentityErrorDescriber.PasswordMismatch)))
            {
                throw AuthUseCaseSupport.Invalid(new Dictionary<string, string[]>
                {
                    ["currentPassword"] = ["Mật khẩu hiện tại không đúng."]
                });
            }
            throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(result.Errors));
        }

        await AuthUseCaseSupport.RevokeAllAsync(user.Id, _tokens, _unitOfWork, ct);
    }
}

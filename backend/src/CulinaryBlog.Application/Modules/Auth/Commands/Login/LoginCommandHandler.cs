using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Auth.Commands.Login;

internal sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtService _jwt;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;

    public LoginCommandHandler(
        UserManager<ApplicationUser> users,
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork unitOfWork) =>
        (_users, _jwt, _tokens, _unitOfWork) = (users, jwt, tokens, unitOfWork);

    public async Task<AuthResponseDto> Handle(LoginCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var user = await _users.FindByEmailAsync(request.Email.Trim());

        if (user is null || !user.IsActive)
        {
            throw InvalidCredentials();
        }

        if (await _users.IsLockedOutAsync(user))
        {
            throw await AuthUseCaseSupport.CreateLockedExceptionAsync(user, _users);
        }

        if (!await _users.CheckPasswordAsync(user, request.Password))
        {
            await _users.AccessFailedAsync(user);
            if (await _users.IsLockedOutAsync(user))
            {
                throw await AuthUseCaseSupport.CreateLockedExceptionAsync(user, _users);
            }

            throw InvalidCredentials();
        }

        await _users.ResetAccessFailedCountAsync(user);
        return await AuthUseCaseSupport.IssueTokensAsync(
            user, command.IpAddress, _users, _jwt, _tokens, _unitOfWork, ct);
    }

    private static UnauthorizedException InvalidCredentials() =>
        new(ErrorCodes.AuthInvalidCredentials, AuthUseCaseSupport.InvalidCredentials);
}

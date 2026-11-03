using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using Google.Apis.Auth;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Application.Auth.Commands.GoogleLogin;

internal sealed class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, AuthResponseDto>
{
    private const string Provider = "Google";
    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtService _jwt;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;
    private readonly GoogleAuthOptions _options;

    public GoogleLoginCommandHandler(
        UserManager<ApplicationUser> users,
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork unitOfWork,
        IOptions<GoogleAuthOptions> options) =>
        (_users, _jwt, _tokens, _unitOfWork, _options) =
        (users, jwt, tokens, unitOfWork, options.Value);

    public async Task<AuthResponseDto> Handle(GoogleLoginCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId))
            throw new InvalidOperationException("Google:ClientId is not configured.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                command.Request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [_options.ClientId] });
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedException(ErrorCodes.AuthUnauthorized, "Google token is invalid or expired.");
        }

        if (payload.EmailVerified != true || string.IsNullOrWhiteSpace(payload.Email))
            throw new UnauthorizedException(ErrorCodes.AuthUnauthorized, "Google account email is not verified.");

        var user = await _users.FindByLoginAsync(Provider, payload.Subject)
            ?? await _users.FindByEmailAsync(payload.Email);

        if (user is null)
        {
            user = ApplicationUser.Create(
                string.IsNullOrWhiteSpace(payload.Name) ? payload.Email : payload.Name,
                payload.Email,
                await CreateUniqueUserNameAsync(payload.Email));
            user.EmailConfirmed = true;
            user.AvatarUrl = payload.Picture;

            var created = await _users.CreateAsync(user);
            if (!created.Succeeded)
                throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(created.Errors));

            var roleResult = await _users.AddToRoleAsync(user, Roles.Author);
            if (!roleResult.Succeeded)
            {
                await _users.DeleteAsync(user);
                throw new InvalidOperationException("Could not assign the default Author role.");
            }
        }

        if (!user.IsActive || await _users.IsLockedOutAsync(user))
            throw await AuthUseCaseSupport.CreateLockedExceptionAsync(user, _users);

        var logins = await _users.GetLoginsAsync(user);
        if (!logins.Any(login => login.LoginProvider == Provider && login.ProviderKey == payload.Subject))
        {
            var linked = await _users.AddLoginAsync(user, new UserLoginInfo(Provider, payload.Subject, Provider));
            if (!linked.Succeeded)
                throw new ConflictException(ErrorCodes.AuthEmailExists, "Google account is already linked to another user.");
        }

        var changed = false;
        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            changed = true;
        }
        if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(payload.Picture))
        {
            user.AvatarUrl = payload.Picture;
            changed = true;
        }
        if (changed)
        {
            var updated = await _users.UpdateAsync(user);
            if (!updated.Succeeded)
                throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(updated.Errors));
        }

        return await AuthUseCaseSupport.IssueTokensAsync(
            user, command.IpAddress, _users, _jwt, _tokens, _unitOfWork, ct);
    }

    private async Task<string> CreateUniqueUserNameAsync(string email)
    {
        var seed = new string(email.Split('@')[0]
            .Where(character => char.IsLetterOrDigit(character) || character is '-' or '_' or '.')
            .Take(24)
            .ToArray());
        if (string.IsNullOrWhiteSpace(seed)) seed = "google-user";

        var candidate = seed;
        var suffix = 1;
        while (await _users.FindByNameAsync(candidate) is not null)
            candidate = $"{seed}-{suffix++}";
        return candidate;
    }
}

using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using RefreshTokenEntity = CulinaryBlog.Domain.Modules.Identity.RefreshToken;

namespace CulinaryBlog.Application.Auth.Commands.RefreshToken;

internal sealed class RefreshTokenCommandHandler
    : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtService _jwt;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RefreshTokenCommandHandler> _logger;

    public RefreshTokenCommandHandler(
        UserManager<ApplicationUser> users,
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork unitOfWork,
        ILogger<RefreshTokenCommandHandler> logger) =>
        (_users, _jwt, _tokens, _unitOfWork, _logger) = (users, jwt, tokens, unitOfWork, logger);

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand command, CancellationToken ct)
    {
        var rawToken = command.Request.RefreshToken;
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            throw InvalidToken();
        }

        var stored = await _tokens.GetByHashAsync(_jwt.HashToken(rawToken), ct)
            ?? throw InvalidToken();

        if (stored.IsRevoked)
        {
            if (stored.ReplacedByTokenHash is not null)
            {
                // Token cũ đã được thay thế mà vẫn bị dùng lại: coi như có nguy cơ lộ token.
                _logger.LogWarning(
                    "SECURITY: refresh token reuse detected. UserId={UserId}, Ip={Ip}. Revoking all active tokens.",
                    stored.UserId,
                    command.IpAddress);
                await RevokeAllActiveAsync(stored.UserId, ct);
            }

            throw InvalidToken();
        }

        if (stored.IsExpired)
        {
            throw InvalidToken();
        }

        var user = await _users.FindByIdAsync(stored.UserId);
        if (user is null || !user.IsActive || await _users.IsLockedOutAsync(user))
        {
            throw InvalidToken();
        }

        var roles = await _users.GetRolesAsync(user);
        var access = _jwt.GenerateAccessToken(user, roles);
        var newRefresh = _jwt.GenerateRefreshToken();

        stored.Revoke(newRefresh.TokenHash);
        await _tokens.AddAsync(
            RefreshTokenEntity.Create(
                user.Id,
                newRefresh.TokenHash,
                newRefresh.ExpiresAt,
                command.IpAddress),
            ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return AuthUseCaseSupport.BuildResponse(user, roles, access, newRefresh);
    }

    private async Task RevokeAllActiveAsync(string userId, CancellationToken ct)
    {
        var activeTokens = await _tokens.GetActiveByUserAsync(userId, ct);
        foreach (var token in activeTokens)
        {
            token.Revoke();
        }

        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static UnauthorizedException InvalidToken() =>
        new(ErrorCodes.AuthInvalidCredentials, AuthUseCaseSupport.InvalidRefreshToken);
}

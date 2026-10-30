using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.Logout;

internal sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IJwtService _jwt;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;

    public LogoutCommandHandler(
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork unitOfWork) =>
        (_jwt, _tokens, _unitOfWork) = (jwt, tokens, unitOfWork);

    public async Task Handle(LogoutCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
        {
            return;
        }

        var stored = await _tokens.GetByHashAsync(_jwt.HashToken(command.RefreshToken), ct);
        if (stored is null || stored.UserId != command.UserId)
        {
            return;
        }

        stored.Revoke();
        await _unitOfWork.SaveChangesAsync(ct);
    }
}

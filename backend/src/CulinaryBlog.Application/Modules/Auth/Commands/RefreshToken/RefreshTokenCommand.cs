using CulinaryBlog.Application.Auth.Models;
using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.RefreshToken;

/// <summary>Luân chuyển refresh token và cấp access token mới.</summary>
public sealed record RefreshTokenCommand(RefreshRequest Request, string? IpAddress)
    : IRequest<AuthResponseDto>;

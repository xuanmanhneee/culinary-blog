using CulinaryBlog.Application.Auth.Models;
using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.Login;

/// <summary>Xác thực tài khoản và cấp access/refresh token.</summary>
public sealed record LoginCommand(LoginRequest Request, string? IpAddress)
    : IRequest<AuthResponseDto>;

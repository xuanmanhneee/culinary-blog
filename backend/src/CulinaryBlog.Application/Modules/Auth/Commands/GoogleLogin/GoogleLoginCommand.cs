using CulinaryBlog.Application.Auth.Models;
using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.GoogleLogin;

public sealed record GoogleLoginCommand(GoogleLoginRequest Request, string? IpAddress)
    : IRequest<AuthResponseDto>;

using CulinaryBlog.Application.Auth.Models;
using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.Register;

/// <summary>Đăng ký tài khoản và cấp cặp access/refresh token đầu tiên.</summary>
public sealed record RegisterCommand(RegisterRequest Request, string? IpAddress)
    : IRequest<AuthResponseDto>;

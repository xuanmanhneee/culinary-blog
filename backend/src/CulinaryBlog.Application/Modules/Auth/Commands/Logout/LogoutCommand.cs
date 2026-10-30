using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.Logout;

/// <summary>Thu hồi refresh token thuộc về người dùng hiện tại.</summary>
public sealed record LogoutCommand(string UserId, string RefreshToken) : IRequest;

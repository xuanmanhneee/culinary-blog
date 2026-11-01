using CulinaryBlog.Application.Auth.Models;
using MediatR;

namespace CulinaryBlog.Application.Auth.Commands.UpdateCurrentUser;

/// <summary>Cập nhật các trường hồ sơ được cung cấp trong PATCH /auth/me.</summary>
public sealed record UpdateCurrentUserCommand(string UserId, UpdateProfileRequest Request)
    : IRequest<UserProfileDto>;

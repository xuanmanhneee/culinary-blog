using CulinaryBlog.Application.Auth.Models;
using MediatR;

namespace CulinaryBlog.Application.Auth.Queries.GetCurrentUser;

/// <summary>Lấy hồ sơ của người dùng đang đăng nhập.</summary>
public sealed record GetCurrentUserQuery(string UserId) : IRequest<UserProfileDto>;

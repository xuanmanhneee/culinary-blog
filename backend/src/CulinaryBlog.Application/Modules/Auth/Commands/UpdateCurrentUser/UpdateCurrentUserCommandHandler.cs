using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Auth.Commands.UpdateCurrentUser;

internal sealed class UpdateCurrentUserCommandHandler
    : IRequestHandler<UpdateCurrentUserCommand, UserProfileDto>
{
    private readonly UserManager<ApplicationUser> _users;

    public UpdateCurrentUserCommandHandler(UserManager<ApplicationUser> users) => _users = users;

    public async Task<UserProfileDto> Handle(UpdateCurrentUserCommand command, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(command.UserId)
            ?? throw new NotFoundException(
                ErrorCodes.AuthInvalidCredentials,
                "Người dùng không tồn tại.");

        var request = command.Request;
        if (request.FullName is not null)
        {
            user.DisplayName = request.FullName.Trim();
        }

        if (request.AvatarUrl is not null)
        {
            // Chuỗi rỗng mang nghĩa xóa avatar; null mang nghĩa giữ nguyên.
            user.AvatarUrl = request.AvatarUrl.Length == 0 ? null : request.AvatarUrl;
        }

        var result = await _users.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(result.Errors));
        }

        return await AuthUseCaseSupport.ToProfileAsync(user, _users);
    }
}

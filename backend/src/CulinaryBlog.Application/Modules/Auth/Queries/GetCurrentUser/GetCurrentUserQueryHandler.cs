using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Auth.Queries.GetCurrentUser;

internal sealed class GetCurrentUserQueryHandler
    : IRequestHandler<GetCurrentUserQuery, UserProfileDto>
{
    private readonly UserManager<ApplicationUser> _users;

    public GetCurrentUserQueryHandler(UserManager<ApplicationUser> users) => _users = users;

    public async Task<UserProfileDto> Handle(GetCurrentUserQuery query, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(query.UserId)
            ?? throw new NotFoundException(
                ErrorCodes.AuthInvalidCredentials,
                "Người dùng không tồn tại.");

        return await AuthUseCaseSupport.ToProfileAsync(user, _users);
    }
}

using CulinaryBlog.Application.Auth.Abstractions;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Auth.Commands.Register;

internal sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtService _jwt;
    private readonly IRefreshTokenRepository _tokens;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterCommandHandler(
        UserManager<ApplicationUser> users,
        IJwtService jwt,
        IRefreshTokenRepository tokens,
        IUnitOfWork unitOfWork) =>
        (_users, _jwt, _tokens, _unitOfWork) = (users, jwt, tokens, unitOfWork);

    public async Task<AuthResponseDto> Handle(RegisterCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var email = request.Email.Trim();
        var userName = request.UserName.Trim();

        if (await _users.FindByEmailAsync(email) is not null)
        {
            throw new ConflictException(ErrorCodes.AuthEmailExists, "Email đã được đăng ký.");
        }

        if (await _users.FindByNameAsync(userName) is not null)
        {
            throw new ConflictException(ErrorCodes.AuthEmailExists, "Tên đăng nhập đã được sử dụng.");
        }

        var user = ApplicationUser.Create(request.FullName.Trim(), email, userName);
        var created = await _users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(created.Errors));
        }

        var roleResult = await _users.AddToRoleAsync(user, Roles.Author);
        if (!roleResult.Succeeded)
        {
            // Không để lại tài khoản thiếu role khi bước khởi tạo bị lỗi.
            await _users.DeleteAsync(user);
            throw new InvalidOperationException(
                "Không gán được role mặc định. Kiểm tra IdentitySeeder.SeedRolesAsync đã chạy chưa: "
                + string.Join(", ", roleResult.Errors.Select(error => error.Description)));
        }

        return await AuthUseCaseSupport.IssueTokensAsync(
            user, command.IpAddress, _users, _jwt, _tokens, _unitOfWork, ct);
    }
}

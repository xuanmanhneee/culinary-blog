using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Users.Models;
using CulinaryBlog.Application.Users.Queries.GetUsers;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

public sealed record UpdateUserRoleRequest(string Role);

public sealed record UpdateUserStatusRequest(bool? IsLocked);

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Users", "users")
            .WithTags("Users")
            .RequireAuthorization(AuthServiceCollectionExtensions.AdminPolicy)
            .ProducesAuthProblems();

        group.MapPatch("/{id}/role", async (
                string id,
                UpdateUserRoleRequest request,
                UserManager<ApplicationUser> users,
                RoleManager<IdentityRole> roles,
                HttpContext httpContext,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("CulinaryBlog.API.Endpoints.UserEndpoints");
                var role = Roles.All.FirstOrDefault(candidate =>
                    string.Equals(candidate, request.Role?.Trim(), StringComparison.OrdinalIgnoreCase));
                if (role is null)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        [nameof(request.Role)] = [$"Role must be one of: {string.Join(", ", Roles.All)}."]
                    });
                }

                if (!await roles.RoleExistsAsync(role))
                {
                    throw new InvalidOperationException(
                        $"Role '{role}' is not seeded. IdentitySeeder.SeedRolesAsync must run before user management.");
                }

                var user = await users.FindByIdAsync(id)
                    ?? throw new NotFoundException(ErrorCodes.UserNotFound, $"User '{id}' was not found.");
                var existingRoles = await users.GetRolesAsync(user);

                if (existingRoles.Count == 1 && string.Equals(existingRoles[0], role, StringComparison.Ordinal))
                {
                    return Results.NoContent();
                }

                var removed = await users.RemoveFromRolesAsync(user, existingRoles);
                if (!removed.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Unable to remove the user's existing roles: {FormatIdentityErrors(removed)}");
                }

                var added = await users.AddToRoleAsync(user, role);
                if (!added.Succeeded)
                {
                    var restored = existingRoles.Count == 0
                        ? IdentityResult.Success
                        : await users.AddToRolesAsync(user, existingRoles);
                    if (!restored.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Unable to assign role '{role}' ({FormatIdentityErrors(added)}) or restore the previous roles ({FormatIdentityErrors(restored)}).");
                    }

                    throw new InvalidOperationException(
                        $"Unable to assign role '{role}': {FormatIdentityErrors(added)}");
                }

                logger.LogInformation(
                    "User role changed by administrator {AdministratorId}: {UserId} from {PreviousRoles} to {Role}",
                    httpContext.User.GetUserId(), user.Id, existingRoles, role);
                return Results.NoContent();
            })
            .WithName("UpdateUserRole")
            .WithSummary("Thay đổi vai trò người dùng")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesNotFoundProblem();

        group.MapPatch("/{id}/status", async (
                string id,
                UpdateUserStatusRequest request,
                UserManager<ApplicationUser> users,
                HttpContext httpContext,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("CulinaryBlog.API.Endpoints.UserEndpoints");
                if (request.IsLocked is null)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        [nameof(request.IsLocked)] = ["The IsLocked field is required."]
                    });
                }

                var isLocked = request.IsLocked.Value;
                var user = await users.FindByIdAsync(id)
                    ?? throw new NotFoundException(ErrorCodes.UserNotFound, $"User '{id}' was not found.");

                EnsureSucceeded(await users.SetLockoutEnabledAsync(user, true), "update lockout setting");
                EnsureSucceeded(
                    await users.SetLockoutEndDateAsync(
                        user, isLocked ? DateTimeOffset.MaxValue : null),
                    isLocked ? "lock user" : "unlock user");

                if (!isLocked)
                {
                    EnsureSucceeded(await users.ResetAccessFailedCountAsync(user), "reset access failed count");
                }

                logger.LogInformation(
                    "User account {Action} by administrator {AdministratorId}: {UserId}",
                    isLocked ? "locked" : "unlocked",
                    httpContext.User.GetUserId(),
                    user.Id);
                return Results.NoContent();
            })
            .WithName("UpdateUserStatus")
            .WithSummary("Khóa hoặc mở khóa tài khoản người dùng")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem()
            .ProducesNotFoundProblem();

        group.MapDelete("/{id}", async (
                string id,
                UserManager<ApplicationUser> users,
                HttpContext httpContext,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("CulinaryBlog.API.Endpoints.UserEndpoints");
                var user = await users.FindByIdAsync(id)
                    ?? throw new NotFoundException(ErrorCodes.UserNotFound, $"User '{id}' was not found.");
                EnsureSucceeded(await users.DeleteAsync(user), "delete user");

                logger.LogInformation(
                    "User deleted by administrator {AdministratorId}: {UserId}",
                    httpContext.User.GetUserId(), id);
                return Results.NoContent();
            })
            .WithName("DeleteUser")
            .WithSummary("Xóa tài khoản người dùng")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesNotFoundProblem();

        group.MapGet("/", async (
                ISender sender,
                CancellationToken ct,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 20,
                [FromQuery] string? role = null,
                [FromQuery] string? search = null) =>
                Results.Ok(await sender.Send(new GetUsersQuery(page, pageSize, role, search), ct)))
            .WithName("GetUsers")
            .WithSummary("Danh sách người dùng dành cho quản trị viên")
            .WithDescription("Phân trang, tìm theo tên/email/tên đăng nhập và lọc theo vai trò Admin, Author hoặc Reader.")
            .Produces<PagedResult<UserListItemDto>>()
            .ProducesValidationProblem();

        return app;
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to {operation}: {FormatIdentityErrors(result)}");
        }
    }

    private static string FormatIdentityErrors(IdentityResult result) =>
        string.Join("; ", result.Errors.Select(error => error.Description));
}

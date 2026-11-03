using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Users.Models;
using CulinaryBlog.Domain.Modules.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Application.Users.Queries.GetUsers;

internal sealed class GetUsersQueryHandler
    : IRequestHandler<GetUsersQuery, PagedResult<UserListItemDto>>
{
    private readonly UserManager<ApplicationUser> _users;

    public GetUsersQueryHandler(UserManager<ApplicationUser> users) => _users = users;

    public async Task<PagedResult<UserListItemDto>> Handle(GetUsersQuery query, CancellationToken ct)
    {
        var normalizedRole = Roles.All.FirstOrDefault(role =>
            string.Equals(role, query.Role?.Trim(), StringComparison.OrdinalIgnoreCase));

        IEnumerable<ApplicationUser> candidates;
        if (normalizedRole is not null)
        {
            candidates = await _users.GetUsersInRoleAsync(normalizedRole);
        }
        else
        {
            ct.ThrowIfCancellationRequested();
            candidates = _users.Users.ToList();
        }

        var search = query.Search?.Trim();
        var filtered = candidates
            .Where(user => string.IsNullOrWhiteSpace(search) ||
                           Contains(user.DisplayName, search) ||
                           Contains(user.Email, search) ||
                           Contains(user.UserName, search))
            .OrderByDescending(user => user.CreatedAt)
            .ThenBy(user => user.Id, StringComparer.Ordinal)
            .ToList();

        var pageUsers = filtered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        var items = new List<UserListItemDto>(pageUsers.Count);
        foreach (var user in pageUsers)
        {
            var roles = await _users.GetRolesAsync(user);
            items.Add(new UserListItemDto(
                user.Id,
                user.DisplayName,
                user.Email ?? string.Empty,
                user.UserName ?? string.Empty,
                user.AvatarUrl,
                roles.OrderBy(role => role, StringComparer.Ordinal).ToArray(),
                user.EmailConfirmed,
                user.IsActive,
                await _users.IsLockedOutAsync(user),
                user.CreatedAt));
        }

        return PagedResult<UserListItemDto>.Create(items, filtered.Count, query.Page, query.PageSize);
    }

    private static bool Contains(string? value, string search) =>
        value?.Contains(search, StringComparison.OrdinalIgnoreCase) == true;
}

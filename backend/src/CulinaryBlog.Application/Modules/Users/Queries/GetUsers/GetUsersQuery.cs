using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Users.Models;
using MediatR;

namespace CulinaryBlog.Application.Users.Queries.GetUsers;

public sealed record GetUsersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Role = null,
    string? Search = null) : IRequest<PagedResult<UserListItemDto>>;

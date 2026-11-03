using CulinaryBlog.API.Extensions;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Users.Models;
using CulinaryBlog.Application.Users.Queries.GetUsers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapVersionedApiGroup("Users", "users")
            .WithTags("Users")
            .RequireAuthorization(AuthServiceCollectionExtensions.AdminPolicy)
            .ProducesAuthProblems();

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
            .WithDescription("Phân trang, tìm theo tên/email/tên đăng nhập và lọc theo vai trò Admin hoặc Author.")
            .Produces<PagedResult<UserListItemDto>>()
            .ProducesValidationProblem();

        return app;
    }
}

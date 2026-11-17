using System;
using System.Security.Claims;
using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Infrastructure.Modules.Identity;

public sealed class HttpCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public HttpCurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

    public string? UserId
    {
        get
        {
            var value = _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _accessor.HttpContext?.User.FindFirstValue("sub");
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }

    public bool IsAdmin => _accessor.HttpContext?.User.IsInRole("Admin") == true;

    public bool IsEmailConfirmed =>
        bool.TryParse(_accessor.HttpContext?.User.FindFirstValue("email_verified"), out var confirmed)
        && confirmed;

}

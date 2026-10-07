using System;

namespace CulinaryBlog.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    bool IsAdmin { get; }
}

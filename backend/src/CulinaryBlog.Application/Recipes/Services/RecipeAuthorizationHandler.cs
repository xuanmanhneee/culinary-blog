using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

/// <summary>
/// NFR-SEC-006: kiểm tra quyền trên từng recipe tại Application Layer (resource ownership).
/// Endpoint đã chặn theo role (AuthorPolicy); lớp này chặn tiếp theo chủ sở hữu:
/// Author chỉ thao tác trên recipe của mình, Admin thao tác trên mọi recipe.
/// </summary>
public sealed class RecipeAuthorizationHandler
{
    private readonly ICurrentUserService _currentUser;

    public RecipeAuthorizationHandler(ICurrentUserService currentUser) => _currentUser = currentUser;

    public bool IsAdmin => _currentUser.IsAdmin;

    /// <summary>Id người dùng hiện tại dạng chuỗi (trùng định dạng Recipe.AuthorId), null nếu chưa đăng nhập.</summary>
    public string? CurrentUserId => _currentUser.UserId?.ToString();

    /// <summary>Dùng cho thao tác bắt buộc đăng nhập, ví dụ lấy AuthorId khi tạo recipe.</summary>
    public string RequireUserId() =>
        CurrentUserId ?? throw new UnauthorizedException(ErrorCodes.AuthUnauthorized, "Bạn cần đăng nhập.");

    public bool IsOwnerOrAdmin(Recipe recipe) =>
        _currentUser.IsAdmin ||
        (_currentUser.UserId is { } userId &&
         Guid.TryParse(recipe.AuthorId, out var authorId) &&
         authorId == userId);

    /// <summary>Sửa, xóa, đổi trạng thái, quản lý nguyên liệu/bước/ảnh: chỉ owner hoặc Admin.</summary>
    public void EnsureCanModify(Recipe recipe)
    {
        if (!IsOwnerOrAdmin(recipe))
            throw new ForbiddenException(ErrorCodes.RecipeForbidden, "Bạn không có quyền thao tác trên công thức này.");
    }

    /// <summary>FR-RCP-002: recipe Published ai cũng xem được; Draft/Archived chỉ owner hoặc Admin.</summary>
    public void EnsureCanView(Recipe recipe)
    {
        if (recipe.Status != RecipeStatus.Published && !IsOwnerOrAdmin(recipe))
            throw new ForbiddenException(ErrorCodes.RecipeForbidden, "Bạn không có quyền xem công thức này.");
    }
}

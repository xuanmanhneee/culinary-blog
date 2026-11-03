using System;
using System.Diagnostics;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Application.Common.Behaviors;

/// <summary>
/// Audit log cho mọi thao tác ghi của module Recipe (NFR bảo mật: "log mọi write op với userId + timestamp"):
/// áp cho các command trong namespace <c>CulinaryBlog.Application.Recipes.Commands</c> (tạo/sửa/đổi trạng thái/xóa
/// công thức, nguyên liệu, các bước, ảnh). Ghi action, recipeId, userId, kết quả và thời gian xử lý; không ghi
/// nội dung request. Timestamp, CorrelationId, RequestPath do logger và CorrelationIdMiddleware gắn thêm.
/// Đứng ngoài ValidationBehavior nên cả thao tác bị từ chối (400/403/404/409/422) cũng được ghi.
/// </summary>
public sealed class RecipeAuditBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const string RecipeCommandsNamespace = "CulinaryBlog.Application.Recipes.Commands";

    private static readonly bool IsRecipeCommand =
        typeof(TRequest).Namespace?.StartsWith(RecipeCommandsNamespace, StringComparison.Ordinal) == true;

    /// <summary>"PublishRecipeCommand" → "PublishRecipe".</summary>
    private static readonly string Action = typeof(TRequest).Name.EndsWith("Command", StringComparison.Ordinal)
        ? typeof(TRequest).Name[..^"Command".Length]
        : typeof(TRequest).Name;

    /// <summary>Các command (trừ CreateRecipe) đều có property RecipeId; đọc một lần cho mỗi kiểu command.</summary>
    private static readonly PropertyInfo? RecipeIdProperty = typeof(TRequest).GetProperty("RecipeId", typeof(Guid));

    private readonly ICurrentUserService? _currentUser;
    private readonly ILogger<RecipeAuditBehavior<TRequest, TResponse>> _logger;

    public RecipeAuditBehavior(
        ILogger<RecipeAuditBehavior<TRequest, TResponse>> logger,
        ICurrentUserService? currentUser = null)
    {
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!IsRecipeCommand)
            return await next();

        var userId = _currentUser?.UserId?.ToString() ?? "anonymous";
        var recipeId = RecipeIdProperty?.GetValue(request) as Guid?;
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await next();

            // CreateRecipe chưa có id trước khi chạy: lấy từ kết quả trả về.
            recipeId ??= (response as RecipeDetailDto)?.Id;
            _logger.LogInformation(
                "Recipe audit: {AuditAction} recipe {RecipeId} by user {AuditUserId} succeeded in {ElapsedMs} ms",
                Action, recipeId, userId, stopwatch.ElapsedMilliseconds);
            return response;
        }
        catch (Exception exception)
        {
            var errorCode = exception switch
            {
                AppException app => app.ErrorCode,
                DomainException domain => domain.ErrorCode,
                _ => exception.GetType().Name,
            };
            // Lỗi nghiệp vụ (validation, không có quyền, xung đột...) là Warning; lỗi hệ thống để
            // GlobalExceptionMiddleware ghi Error kèm stack trace, ở đây chỉ đánh dấu thất bại.
            _logger.LogWarning(
                "Recipe audit: {AuditAction} recipe {RecipeId} by user {AuditUserId} failed with {ErrorCode} in {ElapsedMs} ms",
                Action, recipeId, userId, errorCode, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}

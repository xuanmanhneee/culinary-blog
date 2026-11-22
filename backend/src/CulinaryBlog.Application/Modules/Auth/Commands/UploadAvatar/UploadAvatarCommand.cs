using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Application.Auth.Commands.UploadAvatar;

public sealed record UploadAvatarCommand(string UserId, IFormFile File) : IRequest<UserProfileDto>;

public sealed class UploadAvatarCommandValidator : AbstractValidator<UploadAvatarCommand>
{
    public UploadAvatarCommandValidator() =>
        RuleFor(command => command.File)
            .NotNull()
            .Must(file => file is not null && file.Length > 0)
            .WithMessage("Vui lòng chọn ảnh.")
            .Must(file => file is not null && file.Length <= ImageFileValidation.MaxFileSize)
            .WithMessage("Ảnh không được vượt quá 5 MB.")
            .Must(file => file is not null && ImageFileValidation.AllowedContentTypes.Contains(file.ContentType))
            .WithMessage("Chỉ hỗ trợ JPEG, PNG, WebP và AVIF.")
            .OverridePropertyName("file");
}

internal sealed class UploadAvatarCommandHandler : IRequestHandler<UploadAvatarCommand, UserProfileDto>
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IFileStorageService _storage;
    private readonly IFileDeletionScheduler _fileDeletionScheduler;
    private readonly ILogger<UploadAvatarCommandHandler> _logger;

    public UploadAvatarCommandHandler(
        UserManager<ApplicationUser> users,
        IFileStorageService storage,
        IFileDeletionScheduler fileDeletionScheduler,
        ILogger<UploadAvatarCommandHandler> logger) =>
        (_users, _storage, _fileDeletionScheduler, _logger) = (users, storage, fileDeletionScheduler, logger);

    public async Task<UserProfileDto> Handle(UploadAvatarCommand command, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(command.UserId)
            ?? throw new NotFoundException(ErrorCodes.AuthInvalidCredentials, "Người dùng không tồn tại.");
        await ImageFileValidation.ValidateMagicBytesAsync(command.File, ct);

        // Storage nhóm file theo Guid; dùng Id của user làm "thư mục" cho avatar.
        var scope = Guid.TryParse(user.Id, out var id) ? id : Guid.NewGuid();
        var url = await _storage.UploadAsync(scope, command.File, ct);
        var previousUrl = user.AvatarUrl;
        user.AvatarUrl = url;

        var result = await _users.UpdateAsync(user);
        if (!result.Succeeded)
        {
            try { await _storage.DeleteAsync(url, CancellationToken.None); }
            catch (Exception ex) { _logger.LogWarning(ex, "Could not remove orphaned avatar {Url}", url); }
            throw AuthUseCaseSupport.Invalid(AuthUseCaseSupport.ToErrors(result.Errors));
        }

        // Chỉ xóa ảnh cũ nếu nó nằm trên cùng storage (không động tới URL ngoài như ảnh Google).
        if (!string.IsNullOrWhiteSpace(previousUrl)
            && Uri.TryCreate(previousUrl, UriKind.Absolute, out var oldUri)
            && Uri.TryCreate(url, UriKind.Absolute, out var newUri)
            && oldUri.Host == newUri.Host && oldUri.AbsolutePath.Contains("/uploads/", StringComparison.Ordinal))
        {
            _fileDeletionScheduler.Schedule(previousUrl);
        }

        return await AuthUseCaseSupport.ToProfileAsync(user, _users);
    }
}

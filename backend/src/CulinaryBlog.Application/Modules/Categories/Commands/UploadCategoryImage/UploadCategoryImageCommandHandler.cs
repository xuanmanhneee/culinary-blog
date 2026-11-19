using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Application.Categories.Commands.UploadCategoryImage;

internal sealed class UploadCategoryImageCommandHandler : IRequestHandler<UploadCategoryImageCommand, CategoryDto>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _storage;
    private readonly IFileDeletionScheduler _fileDeletionScheduler;
    private readonly ICacheService _cache;
    private readonly ILogger<UploadCategoryImageCommandHandler> _logger;

    public UploadCategoryImageCommandHandler(
        ICategoryRepository categories,
        IUnitOfWork unitOfWork,
        IFileStorageService storage,
        IFileDeletionScheduler fileDeletionScheduler,
        ICacheService cache,
        ILogger<UploadCategoryImageCommandHandler> logger) =>
        (_categories, _unitOfWork, _storage, _fileDeletionScheduler, _cache, _logger) =
        (categories, unitOfWork, storage, fileDeletionScheduler, cache, logger);

    public async Task<CategoryDto> Handle(UploadCategoryImageCommand command, CancellationToken ct)
    {
        var category = await _categories.GetByIdAsync(command.CategoryId, ct)
            ?? throw new NotFoundException(ErrorCodes.CategoryNotFound, $"Category '{command.CategoryId}' không tồn tại.");
        await ImageFileValidation.ValidateMagicBytesAsync(command.File, ct);

        // shortcut: storage hiện dùng chung thư mục theo Guid; tách scope categories khi storage hỗ trợ named folders.
        var url = await _storage.UploadAsync(category.Id, command.File, ct);
        var previousUrl = category.ImageUrl;
        try
        {
            category.Update(category.Name, category.Description, url, category.OrderIndex);
            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch
        {
            try { await _storage.DeleteAsync(url, CancellationToken.None); }
            catch (Exception cleanupException) { _logger.LogWarning(cleanupException, "Could not remove orphaned category image {Url}", url); }
            throw;
        }

        if (!string.IsNullOrWhiteSpace(previousUrl)) _fileDeletionScheduler.Schedule(previousUrl);
        await _cache.EvictByTagAsync("categories", ct);
        await _cache.EvictByTagAsync("recipes", ct);
        return CategoryMappings.ToDto(category, await _categories.CountRecipesInCategoryAsync(category.Id, ct));
    }
}

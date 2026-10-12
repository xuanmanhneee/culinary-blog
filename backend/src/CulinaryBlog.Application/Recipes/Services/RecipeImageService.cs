using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

public sealed class RecipeImageService : IRecipeImageService
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public RecipeImageService(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
    }

    public async Task<IReadOnlyList<RecipeImageDto>> SetPrimaryAsync(
        Guid recipeId,
        Guid imageId,
        CancellationToken cancellationToken = default)
    {
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        if (!recipe.SetPrimaryImage(imageId))
            throw ImageNotFound(imageId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // TODO(FR-RCP-008): EvictByTagAsync("recipes") và $"recipe:{slug}" khi bật Output Cache.
        return recipe.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.OrderIndex)
            .Select(Map)
            .ToList();
    }

    public async Task DeleteAsync(
        Guid recipeId,
        Guid imageId,
        CancellationToken cancellationToken = default)
    {
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        // TODO(FR-RCP-008): lấy OriginalUrl của ảnh trước khi xóa rồi BackgroundJob.Enqueue
        // IFileStorageService.DeleteAsync khi module File Storage có hàm xóa file.
        if (!recipe.RemoveImage(imageId))
            throw ImageNotFound(imageId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Load recipe rồi kiểm tra quyền: chỉ owner hoặc Admin được sửa (NFR-SEC-006).</summary>
    private async Task<Recipe> GetRecipeAsync(Guid recipeId, CancellationToken cancellationToken)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(recipeId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe '{recipeId}' không tồn tại.");

        _authorization.EnsureCanModify(recipe);
        return recipe;
    }

    private static NotFoundException ImageNotFound(Guid imageId) =>
        new(ErrorCodes.ImageNotFound, $"Image '{imageId}' không tồn tại.");

    private static RecipeImageDto Map(RecipeImage image) => new(
        image.Id,
        image.OriginalUrl,
        image.AltText,
        image.IsPrimary,
        image.OrderIndex);
}

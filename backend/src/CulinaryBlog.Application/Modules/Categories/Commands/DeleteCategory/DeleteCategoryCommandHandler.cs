using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Commands.DeleteCategory;

internal sealed class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cache;

    public DeleteCategoryCommandHandler(ICategoryRepository categories, IUnitOfWork unitOfWork, ICacheService cache) =>
        (_categories, _unitOfWork, _cache) = (categories, unitOfWork, cache);

    public async Task Handle(DeleteCategoryCommand command, CancellationToken ct)
    {
        var category = await _categories.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException(ErrorCodes.CategoryNotFound, $"Category '{command.Id}' không tồn tại.");

        if (await _categories.CountRecipesInCategoryAsync(category.Id, ct) > 0)
            throw new ConflictException(
                ErrorCodes.CategoryDeleteHasRecipes,
                "Không thể xóa danh mục đang chứa công thức.");

        category.SoftDelete();
        await _unitOfWork.SaveChangesAsync(ct);
        await _cache.EvictByTagAsync("categories", ct);
    }
}

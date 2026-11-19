using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Commands.UpdateCategory;

internal sealed class UpdateCategoryCommandHandler
    : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cache;

    public UpdateCategoryCommandHandler(ICategoryRepository categories, IUnitOfWork unitOfWork, ICacheService cache) =>
        (_categories, _unitOfWork, _cache) = (categories, unitOfWork, cache);

    public async Task<CategoryDto> Handle(UpdateCategoryCommand command, CancellationToken ct)
    {
        var category = await _categories.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException(ErrorCodes.CategoryNotFound, $"Category '{command.Id}' không tồn tại.");

        var request = command.Request;
        var name = request.Name.Trim();

        if (await _categories.NameExistsAsync(name, category.Id, ct))
            throw new ConflictException(ErrorCodes.CategoryNameExists, $"Tên danh mục '{name}' đã tồn tại.");

        category.Update(
            name,
            request.Description?.Trim(),
            request.ImageUrl?.Trim(),
            request.OrderIndex ?? category.OrderIndex);

        await _unitOfWork.SaveChangesAsync(ct);
        await _cache.EvictByTagAsync("categories", ct);
        await _cache.EvictByTagAsync("recipes", ct);
        return CategoryMappings.ToDto(category);
    }
}

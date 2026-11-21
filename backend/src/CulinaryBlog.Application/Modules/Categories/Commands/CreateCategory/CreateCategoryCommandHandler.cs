using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using MediatR;

namespace CulinaryBlog.Application.Categories.Commands.CreateCategory;

internal sealed class CreateCategoryCommandHandler
    : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cache;

    public CreateCategoryCommandHandler(ICategoryRepository categories, IUnitOfWork unitOfWork, ICacheService cache) =>
        (_categories, _unitOfWork, _cache) = (categories, unitOfWork, cache);

    public async Task<CategoryDto> Handle(CreateCategoryCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var name = request.Name.Trim();
        if (await _categories.NameExistsAsync(name, cancellationToken: ct))
            throw new ConflictException(ErrorCodes.CategoryNameExists, $"Tên danh mục '{name}' đã tồn tại.");

        string slug;
        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            var baseSlug = SlugHelper.Generate(name);
            slug = baseSlug;
            for (var suffix = 2; await _categories.SlugExistsAsync(slug, ct); suffix++)
                slug = $"{baseSlug}-{suffix}";
        }
        else
        {
            slug = request.Slug.Trim().ToLowerInvariant();
            if (await _categories.SlugExistsAsync(slug, ct))
                throw new ConflictException(ErrorCodes.CategorySlugExists, $"Slug '{slug}' đã tồn tại.");
        }

        var category = Category.Create(
            name,
            slug,
            request.Description?.Trim(),
            request.OrderIndex,
            request.ImageUrl?.Trim());
        await _categories.AddAsync(category, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        await _cache.EvictByTagAsync("categories", ct);
        return CategoryMappings.ToDto(category);
    }
}

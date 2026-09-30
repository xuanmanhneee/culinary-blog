using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;

namespace CulinaryBlog.Application.Categories.Services;

public sealed class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    
    private const int NameMaxLength = 100;
    private const int SlugMaxLength = 120;

    public CategoryService(ICategoryRepository categories, IUnitOfWork unitOfWork)
    {
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _categories.GetAllWithRecipeCountAsync(cancellationToken);
        return categories.Select(Map).ToList();
    }

    public async Task<CategoryDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var category = await _categories.GetBySlugAsync(slug.Trim(), cancellationToken);
        return category is null ? null : Map(category);
    }

    public async Task<CategoryDto> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request);

        var name = request.Name.Trim();
        var slug = request.Slug.Trim().ToLowerInvariant();

        if (await _categories.NameExistsAsync(name, cancellationToken))
            throw new ConflictException(
                ErrorCodes.CategoryNameExists, $"Tên danh mục '{name}' đã tồn tại.");

        if (await _categories.GetBySlugAsync(slug, cancellationToken) is not null)
            throw new ConflictException(
                ErrorCodes.CategorySlugExists, $"Slug '{slug}' đã tồn tại.");

        var category = Category.Create(name, slug, request.Description?.Trim(), request.OrderIndex);
        await _categories.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Map(category);
    }

    private static void Validate(CreateCategoryRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Name))
            errors["name"] = ["Tên danh mục là bắt buộc."];
        else if (request.Name.Trim().Length > NameMaxLength)
            errors["name"] = [$"Tên danh mục tối đa {NameMaxLength} ký tự."];

        if (string.IsNullOrWhiteSpace(request.Slug))
            errors["slug"] = ["Slug là bắt buộc."];
        else if (request.Slug.Trim().Length > SlugMaxLength)
            errors["slug"] = [$"Slug tối đa {SlugMaxLength} ký tự."];

        if (request.OrderIndex < 0)
            errors["orderIndex"] = ["Thứ tự hiển thị không được âm."];

        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    private static CategoryDto Map(Category category) => new(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        category.ImageUrl,
        category.OrderIndex);
}

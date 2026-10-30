using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Domain.Modules.Categories;

namespace CulinaryBlog.Application.Categories;

internal static class CategoryMappings
{
    public static CategoryDto ToDto(Category category) =>
        new(category.Id, category.Name, category.Slug, category.Description, category.ImageUrl, category.OrderIndex);
}

namespace CulinaryBlog.Application.Categories.Models;

public sealed record CreateCategoryRequest(
    string Name,
    string Slug,
    string? Description = null,
    int OrderIndex = 0);

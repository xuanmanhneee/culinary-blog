namespace CulinaryBlog.Application.Categories.Models;

public sealed record CreateCategoryRequest(
    string Name,
    string Slug,
    string? Description = null,
    int OrderIndex = 0,
    string? ImageUrl = null);

public sealed record UpdateCategoryRequest(
    string Name,
    string? Description = null,
    string? ImageUrl = null,
    int? OrderIndex = null);

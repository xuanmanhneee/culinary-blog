using CulinaryBlog.Application.Categories.Models;
using MediatR;

namespace CulinaryBlog.Application.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;

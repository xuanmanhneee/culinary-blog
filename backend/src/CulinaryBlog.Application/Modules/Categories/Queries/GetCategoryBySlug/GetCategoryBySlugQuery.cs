using CulinaryBlog.Application.Categories.Models;
using MediatR;

namespace CulinaryBlog.Application.Categories.Queries.GetCategoryBySlug;

public sealed record GetCategoryBySlugQuery(string Slug) : IRequest<CategoryDto?>;

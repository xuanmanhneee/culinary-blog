using CulinaryBlog.Application.Categories.Models;
using MediatR;

namespace CulinaryBlog.Application.Categories.Commands.UpdateCategory;

public sealed record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Request) : IRequest<CategoryDto>;

using CulinaryBlog.Application.Categories.Models;
using MediatR;

namespace CulinaryBlog.Application.Categories.Commands.CreateCategory;

public sealed record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<CategoryDto>;

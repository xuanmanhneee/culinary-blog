using CulinaryBlog.Application.Categories.Models;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Application.Categories.Commands.UploadCategoryImage;

public sealed record UploadCategoryImageCommand(Guid CategoryId, IFormFile File) : IRequest<CategoryDto>;

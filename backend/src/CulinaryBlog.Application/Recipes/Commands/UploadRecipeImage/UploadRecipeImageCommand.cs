using System;
using CulinaryBlog.Application.Recipes.Models;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public record UploadRecipeImageCommand(Guid RecipeId, IFormFile File) : IRequest<RecipeImageDto>;

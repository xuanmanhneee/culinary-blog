using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Guid recipeId, IFormFile file, CancellationToken cancellationToken);
    Task<string> UploadAsync(Guid recipeId, Stream stream, string contentType, string extension, CancellationToken cancellationToken);
}

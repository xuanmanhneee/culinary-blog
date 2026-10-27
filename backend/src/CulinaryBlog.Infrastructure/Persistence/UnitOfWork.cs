using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly CulinaryBlogDbContext _context;
    private readonly ILogger<UnitOfWork> _logger;

    public UnitOfWork(CulinaryBlogDbContext context, ILogger<UnitOfWork> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Đổi DbUpdateConcurrencyException của EF Core thành ConcurrencyConflictException
    /// để tầng Application/API không phụ thuộc EF (map sang HTTP 422).
    /// </summary>
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(
                ex,
                "Optimistic concurrency conflict while saving {EntityTypes}",
                string.Join(", ", ex.Entries.Select(entry => entry.Metadata.ClrType.Name)));

            var errorCode = ex.Entries.Any(e => e.Entity is Recipe)
                ? ErrorCodes.RecipeConcurrencyConflict
                : ErrorCodes.ConcurrencyConflict;

            throw new ConcurrencyConflictException(
                errorCode,
                "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại và thử lại.");
        }
    }
}

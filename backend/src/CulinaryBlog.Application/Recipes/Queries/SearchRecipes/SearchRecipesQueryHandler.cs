using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Domain.Recipes.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public class SearchRecipesQueryHandler : IRequestHandler<SearchRecipesQuery, PagedResult<RecipeSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public SearchRecipesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<RecipeSummaryDto>> Handle(SearchRecipesQuery request, CancellationToken cancellationToken)
    {
        var terms = request.SearchTerm.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var queryFormatted = string.Join(" & ", terms) + ":*";

        var query = _context.Recipes
            .Where(r => r.Status == RecipeStatus.Published && !r.IsDeleted)
            .Where(r => r.SearchVector != null && r.SearchVector.Matches(EF.Functions.ToTsQuery("vietnamese", queryFormatted)));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.SearchVector!.Rank(EF.Functions.ToTsQuery("vietnamese", queryFormatted)))
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new RecipeSummaryDto
            {
                Id = r.Id,
                Title = r.Title,
                Slug = r.Slug,
                Description = r.Description,
                ThumbnailUrl = r.ThumbnailUrl,
                Rank = r.SearchVector!.Rank(EF.Functions.ToTsQuery("vietnamese", queryFormatted))
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<RecipeSummaryDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

using System;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public class RecipeSummaryDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = default!;
    public string Slug { get; init; } = default!;
    public string? Description { get; init; }
    public string? ThumbnailUrl { get; init; }
    public double Rank { get; init; }
}


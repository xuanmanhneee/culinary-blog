using System;
using CulinaryBlog.Domain.Recipes.Enums;
using NpgsqlTypes; // Needed for NpgsqlTsVector, but wait! Domain should not depend on Npgsql!

namespace CulinaryBlog.Domain.Recipes.Entities;

public class Recipe
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public RecipeStatus Status { get; set; }
    public bool IsDeleted { get; set; }
    public Guid AuthorId { get; set; }
    public ICollection<RecipeImage> Images { get; set; } = new List<RecipeImage>();
    
    // We use a mapping in DbContext, but if we need SearchVector property:
    public NpgsqlTsVector? SearchVector { get; set; }
}

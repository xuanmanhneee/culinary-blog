using System;

namespace CulinaryBlog.Domain.Recipes.Entities;

public class RecipeImage
{
    public Guid Id { get; set; }
    public Guid RecipeId { get; set; }
    public Recipe Recipe { get; set; } = default!;
    public string OriginalUrl { get; set; } = default!;
    public bool IsPrimary { get; set; }
}

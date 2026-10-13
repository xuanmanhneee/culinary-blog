using System;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public sealed class RecipeImageDto
{
    public Guid Id { get; init; }
    public string OriginalUrl { get; init; } = default!;
    public bool IsPrimary { get; init; }
}

using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;

public class RecipeSeeder(
    CulinaryBlogDbContext context,
    IFileStorageService storage,
    IHttpClientFactory httpClientFactory,
    ILogger<RecipeSeeder> logger)
{
    public async Task SeedAsync(IReadOnlyDictionary<string, Category> categories, IReadOnlyList<ApplicationUser> authors)
    {
        if (authors.Count == 0)
            throw new InvalidOperationException("Recipe seed cần ít nhất một author.");

        var existingRecipes = await context.Recipes
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(recipe => recipe.Images)
            .ToDictionaryAsync(recipe => recipe.Slug, StringComparer.OrdinalIgnoreCase);
        var recipes = new List<Recipe>();
        var imagesAdded = 0;

        for (var index = 0; index < RecipeSeedData.Recipes.Length; index++)
        {
            var seed = RecipeSeedData.Recipes[index];
            var slug = SlugHelper.Generate(seed.Title);
            if (existingRecipes.TryGetValue(slug, out var existingRecipe))
            {
                if (existingRecipe.Images.Count == 0)
                {
                    var imageUrl = await UploadSeedImageAsync(existingRecipe.Id, seed.ImageIndex);
                    context.RecipeImages.Add(RecipeImage.Create(
                        existingRecipe.Id, imageUrl, true, 0, $"Ảnh món {seed.Title}"));
                    imagesAdded++;
                }

                continue;
            }

            if (!categories.TryGetValue(seed.Category, out var category))
                continue;

            var author = authors[index % authors.Count];
            var recipe = Recipe.Create(seed.Title, slug, seed.Description, seed.Tip, category.Id, author.Id,
                seed.PrepTime, seed.CookTime, seed.Servings, seed.Difficulty);
            foreach (var (name, quantity, unit) in seed.Ingredients)
                recipe.AddIngredient(name, quantity, unit);
            foreach (var (title, description) in seed.Steps)
                recipe.AddStep(title, description);
            await AddSeedImageAsync(recipe, seed.Title, seed.ImageIndex);

            if (!seed.Draft)
                recipe.Publish();
            recipes.Add(recipe);
        }

        if (recipes.Count > 0 || imagesAdded > 0)
        {
            if (recipes.Count > 0)
                context.Recipes.AddRange(recipes);
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Recipe seed: thêm {Count} công thức, bổ sung {ImageCount} ảnh.", recipes.Count, imagesAdded);
    }

    private async Task AddSeedImageAsync(Recipe recipe, string title, int imageIndex)
    {
        var imageUrl = await UploadSeedImageAsync(recipe.Id, imageIndex);
        recipe.AddImage(imageUrl, true, $"Ảnh món {title}");
    }

    private async Task<string> UploadSeedImageAsync(Guid recipeId, int imageIndex)
    {
        var sourceUrl = RecipeSeedData.ImageUrls[imageIndex % RecipeSeedData.ImageUrls.Length];
        var client = httpClientFactory.CreateClient("media");
        using var response = await client.GetAsync(sourceUrl, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        await using var imageStream = new MemoryStream();
        await response.Content.CopyToAsync(imageStream);
        imageStream.Position = 0;
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
        return await storage.UploadAsync(recipeId, imageStream, contentType, ".jpg", CancellationToken.None);
    }
}

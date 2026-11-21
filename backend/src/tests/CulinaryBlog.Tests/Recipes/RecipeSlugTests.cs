using CulinaryBlog.Application.Recipes;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Tests.Recipes;

public sealed class RecipeSlugTests
{
    [Theory]
    [InlineData(new[] { "ten-mon" }, null, "ten-mon-2")]
    [InlineData(new[] { "ten-mon", "ten-mon-2" }, null, "ten-mon-3")]
    [InlineData(new[] { "ten-mon" }, "ten-mon", "ten-mon")]
    public async Task GenerateUniqueSlugAsync_AppendsSuffixAndIgnoresCurrentRecipe(
        string[] existingSlugs,
        string? currentSlug,
        string expected)
    {
        var repository = new RecipeRepositoryStub(existingSlugs);

        var slug = await RecipeUseCaseSupport.GenerateUniqueSlugAsync(
            "Tên món", repository, CancellationToken.None, currentSlug);

        Assert.Equal(expected, slug);
    }

    private sealed class RecipeRepositoryStub(IEnumerable<string> existingSlugs) : IRecipeRepository
    {
        private readonly HashSet<string> _existingSlugs = [.. existingSlugs];

        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken = default) =>
            Task.FromResult(_existingSlugs.Contains(slug));

        public Task<Recipe?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Recipe?> GetBySlugWithDetailsAsync(string slug, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Recipe?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Recipe?> GetDeletedByIdAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<(IReadOnlyList<Recipe> Items, int TotalCount)> GetDeletedPagedAsync(int page, int pageSize, string? ownerId = null, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<(IReadOnlyList<Recipe> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, bool includeAllStatuses = false, bool mineOnly = false, string? ownerId = null, Guid? categoryId = null, RecipeDifficulty? difficulty = null, int? minPrepTime = null, int? maxCookTime = null, int? minServings = null, RecipeStatus? status = null, string? sort = null, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Recipe?> GetByIdWithIngredientsAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public void AddIngredient(RecipeIngredient ingredient) => throw new NotSupportedException();
        public Task<Recipe?> GetByIdWithStepsAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Recipe?> GetByIdWithImagesAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public void AddImage(RecipeImage image) => throw new NotSupportedException();
        public void AddStep(RecipeStep step) => throw new NotSupportedException();
        public Task AddAsync(Recipe entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public void Update(Recipe entity) => throw new NotSupportedException();
        public void Remove(Recipe entity) => throw new NotSupportedException();
    }
}

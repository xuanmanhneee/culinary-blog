using CulinaryBlog.Application;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Queries.SearchRecipes;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Tests.Recipes;

public sealed class SearchRecipesQueryTests
{
    [Fact]
    public async Task Send_WithValidQuery_ReturnsMappedPagedResult()
    {
        var recipeId = Guid.NewGuid();
        var reader = new FakeRecipeSearchReader(
            [new RecipeSearchItem(recipeId, "Spicy noodles", "spicy-noodles", "Quick dinner", null, 0.91)],
            totalCount: 1);
        using var provider = CreateProvider(reader);
        using var scope = provider.CreateScope();

        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        var result = await sender.Send(new SearchRecipesQuery("spicy", Page: 1, PageSize: 10));

        var item = Assert.Single(result.Items);
        Assert.Equal(recipeId, item.Id);
        Assert.Equal("Spicy noodles", item.Title);
        Assert.Equal("spicy-noodles", item.Slug);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, reader.CallCount);
    }

    [Fact]
    public async Task Send_WithInvalidQuery_IsRejectedByValidationBehavior()
    {
        var reader = new FakeRecipeSearchReader([], totalCount: 0);
        using var provider = CreateProvider(reader);
        using var scope = provider.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            sender.Send(new SearchRecipesQuery(string.Empty, Page: 0, PageSize: 51)));

        Assert.Contains(nameof(SearchRecipesQuery.SearchTerm), exception.Errors.Keys);
        Assert.Contains(nameof(SearchRecipesQuery.Page), exception.Errors.Keys);
        Assert.Contains(nameof(SearchRecipesQuery.PageSize), exception.Errors.Keys);
        Assert.Equal(0, reader.CallCount);
    }

    private static ServiceProvider CreateProvider(IRecipeSearchReader reader)
    {
        var services = new ServiceCollection();
        // MediatR 14 dùng ILoggerFactory cho phần kiểm tra license; ASP.NET host
        // đăng ký sẵn, còn test container tối giản phải thêm thủ công.
        services.AddLogging();
        services.AddApplicationServices();
        services.AddSingleton(reader);
        return services.BuildServiceProvider(validateScopes: true);
    }

    private sealed class FakeRecipeSearchReader : IRecipeSearchReader
    {
        private readonly IReadOnlyList<RecipeSearchItem> _items;
        private readonly int _totalCount;

        public FakeRecipeSearchReader(IReadOnlyList<RecipeSearchItem> items, int totalCount) =>
            (_items, _totalCount) = (items, totalCount);

        public int CallCount { get; private set; }

        public Task<(IReadOnlyList<RecipeSearchItem> Items, int TotalCount)> SearchAsync(
            string searchTerm,
            int page,
            int pageSize,
            Guid? categoryId = null,
            RecipeDifficulty? difficulty = null,
            int? maxCookTime = null,
            int? minServings = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult((_items, _totalCount));
        }
    }
}

using CulinaryBlog.Application;
using CulinaryBlog.Application.Categories.Commands.CreateCategory;
using CulinaryBlog.Application.Categories.Commands.UpdateCategory;
using CulinaryBlog.Application.Categories.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Infrastructure.Modules.Cache;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Tests.Categories;

public sealed class CategoryCommandsTests
{
    [Fact]
    public async Task Create_GeneratesUniqueVietnameseSlug_AndRenameKeepsIt()
    {
        using var provider = CreateProvider();
        using var scope = provider.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();

        var first = await sender.Send(new CreateCategoryCommand(new("Đồ nướng")));
        var second = await sender.Send(new CreateCategoryCommand(new("Do nuong")));
        var renamed = await sender.Send(new UpdateCategoryCommand(first.Id, new("Món nướng")));
        var legacy = await sender.Send(new CreateCategoryCommand(new("Món chay", "chay")));

        Assert.Equal("do-nuong", first.Slug);
        Assert.Equal("do-nuong-2", second.Slug);
        Assert.Equal(first.Slug, renamed.Slug);
        Assert.Equal("Món nướng", renamed.Name);
        Assert.Equal("chay", legacy.Slug);
    }

    [Fact]
    public async Task Create_RejectsNameThatCannotGenerateSlug()
    {
        using var provider = CreateProvider();
        using var scope = provider.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();

        var error = await Assert.ThrowsAsync<ValidationException>(() =>
            sender.Send(new CreateCategoryCommand(new("!?"))));

        Assert.Contains("name", error.Errors.Keys);
    }

    private static ServiceProvider CreateProvider()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDistributedMemoryCache();
        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<ICategoryRepository, CategoryStore>();
        services.AddScoped<IUnitOfWork>(provider => (CategoryStore)provider.GetRequiredService<ICategoryRepository>());
        services.AddApplicationServices();
        return services.BuildServiceProvider(validateScopes: true);
    }

    private sealed class CategoryStore : ICategoryRepository, IUnitOfWork
    {
        private readonly List<Category> _categories = [];

        public Task<Category?> GetByIdAsync(Guid id, CancellationToken ct) =>
            Task.FromResult(_categories.Find(category => category.Id == id));

        public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) =>
            Task.FromResult(_categories.Any(category => category.Slug == slug));

        public Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken ct) =>
            Task.FromResult(_categories.Any(category => category.Name == name && category.Id != excludingId));

        public Task AddAsync(Category category, CancellationToken ct)
        {
            _categories.Add(category);
            return Task.CompletedTask;
        }

        public Task<int> SaveChangesAsync(CancellationToken ct) => Task.FromResult(1);

        public Task<Category?> GetBySlugAsync(string slug, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<Category>> GetAllWithRecipeCountAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyDictionary<Guid, int>> GetRecipeCountsAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<int> CountRecipesInCategoryAsync(Guid categoryId, CancellationToken ct) => throw new NotSupportedException();
        public void Update(Category category) => throw new NotSupportedException();
        public void Remove(Category category) => throw new NotSupportedException();
    }
}

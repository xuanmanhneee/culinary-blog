using CulinaryBlog.Application.Common.Behaviors;
using CulinaryBlog.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging.Abstractions;
using CulinaryBlog.Application.Recipes.Commands.Test;

namespace CulinaryBlog.Tests.Recipes
{
    public sealed class RecipeAuditBehaviorTests
    {
        [Fact]
        public async Task SuccessfulRecipeCommand_EvictsRecipeAndCategoryCaches()
        {
            var cache = new RecordingCache();
            var behavior = new RecipeAuditBehavior<InvalidateCacheCommand, string>(
                NullLogger<RecipeAuditBehavior<InvalidateCacheCommand, string>>.Instance,
                cache);

            await behavior.Handle(new InvalidateCacheCommand(), _ => Task.FromResult("ok"), CancellationToken.None);

            Assert.Equal(["recipes", "categories"], cache.EvictedTags);
        }

        private sealed class RecordingCache : ICacheService
        {
            public List<string> EvictedTags { get; } = [];

            public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) =>
                Task.FromResult(default(T));

            public Task SetAsync<T>(string key, T value, TimeSpan absoluteExpiration, string tag,
                CancellationToken cancellationToken = default) => Task.CompletedTask;

            public Task EvictByTagAsync(string tag, CancellationToken cancellationToken = default)
            {
                EvictedTags.Add(tag);
                return Task.CompletedTask;
            }
        }
    }
}

namespace CulinaryBlog.Application.Recipes.Commands.Test
{
    public sealed record InvalidateCacheCommand : IRequest<string>;
}

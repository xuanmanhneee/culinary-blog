extern alias EngagementAssembly;
using System.Net;
using System.Text;
using EngagementAssembly::CulinaryBlog.Engagement;

namespace CulinaryBlog.Tests.Engagement;

public sealed class RecipeClientTests
{
    [Fact]
    public async Task PrivateRecipeIsUnavailable()
    {
        var client = CreateClient(HttpStatusCode.Forbidden);

        var result = await client.GetPublishedAsync(Guid.NewGuid(), "draft-recipe", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task PublishedRecipeMapsCanonicalSnapshot()
    {
        var recipeId = Guid.NewGuid();
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent($$"""
                {"id":"{{recipeId}}","slug":"pho-bo","title":"Phở bò","description":"Mô tả","prepTimeMinutes":20,"cookTimeMinutes":40,"status":1,"images":[{"url":"original.jpg","mediumUrl":"medium.jpg","thumbnailUrl":"thumb.jpg","isPrimary":true}]}
                """, Encoding.UTF8, "application/json")
        };
        var client = CreateClient(response);

        var result = await client.GetPublishedAsync(recipeId, "pho-bo", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Phở bò", result.Title);
        Assert.Equal("thumb.jpg", result.PrimaryImageUrl);
        Assert.Equal(60, result.TotalTimeMinutes);
    }

    private static RecipeClient CreateClient(HttpStatusCode status) => CreateClient(new HttpResponseMessage(status));

    private static RecipeClient CreateClient(HttpResponseMessage response) =>
        new(new HttpClient(new StubHandler(response)) { BaseAddress = new Uri("http://recipes/") });

    private sealed class StubHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(response);
    }
}

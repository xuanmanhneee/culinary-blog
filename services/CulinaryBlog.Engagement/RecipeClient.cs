using System.Net;
using System.Net.Http.Json;

namespace CulinaryBlog.Engagement;

public sealed class RecipeClient(HttpClient httpClient)
{
    public async Task<RecipeSnapshot?> GetPublishedAsync(Guid expectedId, string slug, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;

        using var response = await httpClient.GetAsync($"api/v1/recipes/{Uri.EscapeDataString(slug)}", cancellationToken);
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden) return null;
        response.EnsureSuccessStatusCode();

        var recipe = await response.Content.ReadFromJsonAsync<RecipeResponse>(cancellationToken);
        if (recipe is null || recipe.Id != expectedId || recipe.Status != 1) return null;

        var image = recipe.Images.FirstOrDefault(x => x.IsPrimary) ?? recipe.Images.FirstOrDefault();
        return new RecipeSnapshot(recipe.Id, recipe.Slug, recipe.Title, recipe.Description, image?.ThumbnailUrl ?? image?.MediumUrl ?? image?.Url, recipe.PrepTimeMinutes + recipe.CookTimeMinutes);
    }

    /// <summary>Id mọi công thức đã đăng (duyệt từng trang của danh sách công khai), dùng cho seed.</summary>
    public async Task<IReadOnlyList<Guid>> GetPublishedIdsAsync(CancellationToken cancellationToken)
    {
        var ids = new List<Guid>();
        for (var page = 1; ; page++)
        {
            var result = await httpClient.GetFromJsonAsync<RecipePageResponse>(
                $"api/v1/recipes?page={page}&pageSize=50", cancellationToken);
            if (result is null) break;
            ids.AddRange(result.Items.Select(item => item.Id));
            if (page >= result.TotalPages) break;
        }

        return ids;
    }

    private sealed record RecipePageResponse(IReadOnlyList<RecipeIdResponse> Items, int TotalPages);
    private sealed record RecipeIdResponse(Guid Id);

    private sealed record RecipeResponse(Guid Id, string Slug, string Title, string Description, int PrepTimeMinutes, int CookTimeMinutes, int Status, IReadOnlyList<RecipeImageResponse> Images);
    private sealed record RecipeImageResponse(string Url, string? MediumUrl, string? ThumbnailUrl, bool IsPrimary);
}

public sealed record RecipeSnapshot(Guid Id, string Slug, string Title, string Description, string? PrimaryImageUrl, int TotalTimeMinutes);

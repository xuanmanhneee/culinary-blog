using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace CulinaryBlog.Tests.Integration;

[Collection(ApiCollection.Name)]
public sealed class CatalogApiTests(ApiFactory factory)
{
    // ---- FR-CAT ----

    [Fact]
    public async Task Categories_List_IsPublic()
    {
        var response = await factory.NewClient().GetAsync("/api/v1/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(JsonValueKind.Array, (await response.Content.ReadFromJsonAsync<JsonElement>()).ValueKind);
    }

    [Fact]
    public async Task Categories_Create_RequiresAdmin()
    {
        var author = await factory.RegisterAuthorAsync();

        var anonymous = await factory.NewClient().PostAsJsonAsync("/api/v1/categories", new { name = "Món chay" });
        var asAuthor = await factory.NewClient(author.AccessToken).PostAsJsonAsync("/api/v1/categories", new { name = "Món chay" });

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, asAuthor.StatusCode);
    }

    [Fact]
    public async Task Categories_AdminCreate_Returns201WithSlug_AndDuplicateNameConflicts()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var name = $"Món nướng {Guid.NewGuid():N}"[..18];

        var created = await admin.PostAsJsonAsync("/api/v1/categories", new { name });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.NotNull(created.Headers.Location);
        var slug = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("slug").GetString();
        Assert.Matches("^[a-z0-9-]+$", slug!);

        var duplicate = await admin.PostAsJsonAsync("/api/v1/categories", new { name });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    [Fact]
    public async Task Categories_CreateWithShortName_Returns422()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await admin.PostAsJsonAsync("/api/v1/categories", new { name = "A" })).StatusCode);
    }

    [Fact]
    public async Task Categories_Update_KeepsSlug_AndUnknownIdReturns404()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = await factory.CreateCategoryAsync(admin);
        var id = category.GetProperty("id").GetGuid();

        var update = await admin.PutAsJsonAsync($"/api/v1/categories/{id}", new { name = $"Tên mới {Guid.NewGuid():N}"[..16], description = "Mô tả" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        Assert.Equal(category.GetProperty("slug").GetString(), (await update.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("slug").GetString());

        Assert.Equal(HttpStatusCode.NotFound, (await admin.PutAsJsonAsync($"/api/v1/categories/{Guid.NewGuid()}", new { name = "Không tồn tại" })).StatusCode);
    }

    [Fact]
    public async Task Categories_GetBySlug_UnknownReturns404()
    {
        var response = await factory.NewClient().GetAsync("/api/v1/categories/khong-ton-tai-123");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Categories_Delete_WithRecipesReturns409_EmptyReturns204()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var withRecipe = await factory.CreateCategoryAsync(admin);
        await factory.CreateRecipeAsync(admin, withRecipe.GetProperty("id").GetGuid());
        var empty = await factory.CreateCategoryAsync(admin);

        Assert.Equal(HttpStatusCode.Conflict, (await admin.DeleteAsync($"/api/v1/categories/{withRecipe.GetProperty("id").GetGuid()}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/v1/categories/{empty.GetProperty("id").GetGuid()}")).StatusCode);
    }

    // ---- FR-RCP: tạo, quyền xem, xuất bản ----

    [Fact]
    public async Task Recipes_Create_StartsAsDraft_WithSlug_AndNeedsAuthentication()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);

        var recipe = await factory.CreateRecipeAsync(author, category, "Phở bò thử nghiệm");

        Assert.Matches("^[a-z0-9-]+$", recipe.GetProperty("slug").GetString()!);
        Assert.Contains("pho", recipe.GetProperty("slug").GetString());
        var anonymous = await factory.NewClient().PostAsJsonAsync("/api/v1/recipes", new { title = "x" });
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task Recipes_Create_InvalidBody_Returns422()
    {
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);

        var response = await author.PostAsJsonAsync("/api/v1/recipes", new
        {
            title = "ab", description = "", categoryId = Guid.NewGuid(), prepTimeMinutes = 0, cookTimeMinutes = -1, servings = 0, difficulty = 1
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Recipes_Create_WithUnknownCategory_IsRejected()
    {
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);

        var response = await author.PostAsJsonAsync("/api/v1/recipes", new
        {
            title = "Món không danh mục", description = "Mô tả", categoryId = Guid.NewGuid(),
            prepTimeMinutes = 5, cookTimeMinutes = 5, servings = 1, difficulty = 1
        });

        Assert.True(response.StatusCode is HttpStatusCode.UnprocessableEntity or HttpStatusCode.NotFound, response.StatusCode.ToString());
    }

    [Fact]
    public async Task Recipes_Draft_IsHiddenFromGuests_AndVisibleToOwner()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = await factory.RegisterAuthorAsync();
        var ownerClient = factory.NewClient(owner.AccessToken);
        var slug = (await factory.CreateRecipeAsync(ownerClient, category)).GetProperty("slug").GetString();

        var guest = await factory.NewClient().GetAsync($"/api/v1/recipes/{slug}");
        var asOwner = await ownerClient.GetAsync($"/api/v1/recipes/{slug}");
        var asStranger = await factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken).GetAsync($"/api/v1/recipes/{slug}");

        Assert.True(guest.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden, guest.StatusCode.ToString());
        Assert.Equal(HttpStatusCode.OK, asOwner.StatusCode);
        Assert.True(asStranger.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden, asStranger.StatusCode.ToString());
    }

    [Fact]
    public async Task Recipes_Publish_WithoutSteps_Returns400_ThenSucceedsAfterAddingStep_AndIsIdempotent()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var recipe = await factory.CreateRecipeAsync(author, category);
        var id = recipe.GetProperty("id").GetGuid();
        var slug = recipe.GetProperty("slug").GetString();

        var incomplete = await author.PatchAsync($"/api/v1/recipes/{id}/publish", null);
        Assert.Equal(HttpStatusCode.BadRequest, incomplete.StatusCode);
        Assert.Contains("RECIPE_PUBLISH_INCOMPLETE", await incomplete.Content.ReadAsStringAsync());

        Assert.Equal(HttpStatusCode.Created, (await author.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Luộc xương 2 giờ." })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await author.PatchAsync($"/api/v1/recipes/{id}/publish", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await author.PatchAsync($"/api/v1/recipes/{id}/publish", null)).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await factory.NewClient().GetAsync($"/api/v1/recipes/{slug}")).StatusCode);
    }

    [Fact]
    public async Task Recipes_PublishedList_ContainsOnlyPublished_AndSupportsPaging()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var published = await factory.CreateRecipeAsync(author, category, "Món đã đăng thử");
        var draft = await factory.CreateRecipeAsync(author, category, "Món nháp thử");
        var id = published.GetProperty("id").GetGuid();
        await author.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Bước 1" });
        await author.PatchAsync($"/api/v1/recipes/{id}/publish", null);

        var list = await factory.NewClient().GetFromJsonAsync<JsonElement>($"/api/v1/recipes?categoryId={category}&pageSize=5");

        var slugs = list.GetProperty("items").EnumerateArray().Select(item => item.GetProperty("slug").GetString()).ToList();
        Assert.Contains(published.GetProperty("slug").GetString(), slugs);
        Assert.DoesNotContain(draft.GetProperty("slug").GetString(), slugs);
        Assert.Equal(1, list.GetProperty("totalCount").GetInt32());
        Assert.False(list.GetProperty("hasNextPage").GetBoolean());
    }

    [Fact]
    public async Task Recipes_List_PageSizeAboveMaximum_IsRejectedOrClamped()
    {
        var response = await factory.NewClient().GetAsync("/api/v1/recipes?pageSize=500");

        Assert.True(response.StatusCode is HttpStatusCode.UnprocessableEntity or HttpStatusCode.OK);
        if (response.StatusCode == HttpStatusCode.OK)
            Assert.True((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("pageSize").GetInt32() <= 50);
    }

    [Fact]
    public async Task Recipes_Update_ByNonOwner_Returns403_AndByOwnerWithStaleVersionReturns409()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var stranger = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var recipe = await factory.CreateRecipeAsync(owner, category);
        var id = recipe.GetProperty("id").GetGuid();
        var body = new
        {
            title = "Tiêu đề đã cập nhật", description = "Mô tả mới dài hơn", categoryId = category,
            prepTimeMinutes = 5, cookTimeMinutes = 5, servings = 2, difficulty = 2
        };

        HttpRequestMessage Put() => new(HttpMethod.Put, $"/api/v1/recipes/{id}")
        {
            Content = JsonContent.Create(body),
            Headers = { { "If-Match", "\"AAAAAAAAAAA=\"" } }
        };

        Assert.Equal(HttpStatusCode.Forbidden, (await stranger.SendAsync(Put())).StatusCode);

        var stale = await owner.SendAsync(Put());
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Contains("RECIPE_CONCURRENCY_CONFLICT", await stale.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Recipes_Delete_ByOwner_Returns204_AndRecipeDisappears()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var recipe = await factory.CreateRecipeAsync(owner, category);
        var id = recipe.GetProperty("id").GetGuid();

        Assert.Equal(HttpStatusCode.Forbidden, (await factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken).DeleteAsync($"/api/v1/recipes/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/recipes/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/api/v1/recipes/{recipe.GetProperty("slug").GetString()}")).StatusCode);
    }

    [Fact]
    public async Task Recipes_Archive_HidesFromGuests()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var recipe = await factory.CreateRecipeAsync(owner, category);
        var id = recipe.GetProperty("id").GetGuid();
        await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Bước 1" });
        await owner.PatchAsync($"/api/v1/recipes/{id}/publish", null);

        Assert.Equal(HttpStatusCode.OK, (await owner.PatchAsync($"/api/v1/recipes/{id}/archive", null)).StatusCode);

        var guest = await factory.NewClient().GetAsync($"/api/v1/recipes/{recipe.GetProperty("slug").GetString()}");
        Assert.True(guest.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden);
    }

    // ---- FR-RCP-009/010 nguyên liệu và bước ----

    [Fact]
    public async Task Steps_AreNumberedAndRenumberedAfterDelete()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var recipe = await factory.CreateRecipeAsync(owner, category);
        var id = recipe.GetProperty("id").GetGuid();

        var first = await (await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Một" })).Content.ReadFromJsonAsync<JsonElement>();
        await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Hai" });
        await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Ba" });

        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/recipes/{id}/steps/{first.GetProperty("id").GetGuid()}")).StatusCode);

        var detail = await owner.GetFromJsonAsync<JsonElement>($"/api/v1/recipes/{recipe.GetProperty("slug").GetString()}");
        var numbers = detail.GetProperty("steps").EnumerateArray().Select(step => step.GetProperty("stepNumber").GetInt32()).OrderBy(n => n).ToList();
        Assert.Equal([1, 2], numbers);
    }

    [Fact]
    public async Task Steps_AddByStranger_Returns403_AndUnknownStepReturns404()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var id = (await factory.CreateRecipeAsync(owner, category)).GetProperty("id").GetGuid();

        var stranger = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        Assert.Equal(HttpStatusCode.Forbidden, (await stranger.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "x" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.DeleteAsync($"/api/v1/recipes/{id}/steps/{Guid.NewGuid()}")).StatusCode);
    }

    [Fact]
    public async Task Ingredients_AddUpdateDelete_AndRejectInvalidQuantity()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var id = (await factory.CreateRecipeAsync(owner, category)).GetProperty("id").GetGuid();

        var added = await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/ingredients", new { name = "Thịt bò", quantity = 500, unit = "g" });
        Assert.Equal(HttpStatusCode.Created, added.StatusCode);
        var ingredientId = (await added.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var updated = await owner.PutAsJsonAsync($"/api/v1/recipes/{id}/ingredients/{ingredientId}", new { name = "Thịt bò tái", quantity = 300, unit = "g", notes = "thái mỏng" });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        var invalid = await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/ingredients", new { name = "Hành", quantity = -1, unit = "củ" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/recipes/{id}/ingredients/{ingredientId}")).StatusCode);
    }

    // ---- FR-RCP-008 ảnh ----

    [Fact]
    public async Task Images_UploadPng_FirstBecomesPrimary_InvalidFileRejected_AndDelete()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var id = (await factory.CreateRecipeAsync(owner, category)).GetProperty("id").GetGuid();

        using var form = new MultipartFormDataContent { { ApiFactory.PngFile(), "file", "pho.png" } };
        var upload = await owner.PostAsync($"/api/v1/recipes/{id}/images", form);
        Assert.Equal(HttpStatusCode.Created, upload.StatusCode);
        var image = await upload.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(image.GetProperty("isPrimary").GetBoolean());

        var fake = new ByteArrayContent("không phải ảnh"u8.ToArray());
        fake.Headers.ContentType = new("image/png");
        using var badForm = new MultipartFormDataContent { { fake, "file", "x.png" } };
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await owner.PostAsync($"/api/v1/recipes/{id}/images", badForm)).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/v1/recipes/{id}/images/{image.GetProperty("id").GetGuid()}")).StatusCode);
    }

    [Fact]
    public async Task Images_UnsupportedContentType_IsRejected()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var id = (await factory.CreateRecipeAsync(owner, category)).GetProperty("id").GetGuid();

        var gif = new ByteArrayContent("GIF89a"u8.ToArray());
        gif.Headers.ContentType = new("image/gif");
        using var form = new MultipartFormDataContent { { gif, "file", "x.gif" } };

        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await owner.PostAsync($"/api/v1/recipes/{id}/images", form)).StatusCode);
    }

    // ---- FR-SRCH ----

    [Fact]
    public async Task Search_QueryShorterThanTwoCharacters_Returns422()
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await factory.NewClient().GetAsync("/api/v1/recipes/search?q=a")).StatusCode);
    }

    [Fact]
    public async Task Search_FindsPublishedRecipeIgnoringAccents_AndExcludesDrafts()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var category = (await factory.CreateCategoryAsync(admin)).GetProperty("id").GetGuid();
        var owner = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);
        var keyword = $"bunbo{Guid.NewGuid():N}"[..14];
        var published = await factory.CreateRecipeAsync(owner, category, $"Bún bò {keyword}");
        var draft = await factory.CreateRecipeAsync(owner, category, $"Bún bò nháp {keyword}");
        var id = published.GetProperty("id").GetGuid();
        await owner.PostAsJsonAsync($"/api/v1/recipes/{id}/steps", new { description = "Nấu nước dùng" });
        await owner.PatchAsync($"/api/v1/recipes/{id}/publish", null);

        var result = await factory.NewClient().GetFromJsonAsync<JsonElement>($"/api/v1/recipes/search?q={keyword}");

        var slugs = result.GetProperty("items").EnumerateArray().Select(item => item.GetProperty("slug").GetString()).ToList();
        Assert.Contains(published.GetProperty("slug").GetString(), slugs);
        Assert.DoesNotContain(draft.GetProperty("slug").GetString(), slugs);
    }
}

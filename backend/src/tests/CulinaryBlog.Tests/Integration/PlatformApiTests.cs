using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

namespace CulinaryBlog.Tests.Integration;

[Collection(ApiCollection.Name)]
public sealed class PlatformApiTests(ApiFactory factory)
{
    // ---- FR-OBS-001 health ----

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task Health_Endpoints_ReturnOk(string path) =>
        Assert.Equal(HttpStatusCode.OK, (await factory.NewClient().GetAsync(path)).StatusCode);

    // ---- FR-OBS-002 correlation id, RFC 7807 ----

    [Fact]
    public async Task Response_EchoesCorrelationId_AndGeneratesOneWhenMissing()
    {
        var client = factory.NewClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/categories");
        request.Headers.Add("X-Correlation-ID", "test-correlation-123");

        var echoed = await client.SendAsync(request);
        var generated = await client.GetAsync("/api/v1/categories");

        Assert.Equal("test-correlation-123", echoed.Headers.GetValues("X-Correlation-ID").Single());
        Assert.False(string.IsNullOrWhiteSpace(generated.Headers.GetValues("X-Correlation-ID").Single()));
    }

    [Fact]
    public async Task UnknownRoute_ReturnsProblemJson404()
    {
        var response = await factory.NewClient().GetAsync("/api/v1/khong-co-route");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task NotFoundRecipe_ReturnsProblemDetailsWithApplicationErrorCode()
    {
        var response = await factory.NewClient().GetAsync("/api/v1/recipes/khong-ton-tai-abc");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(404, body.GetProperty("status").GetInt32());
        Assert.Contains("RECIPE_NOT_FOUND", body.GetProperty("type").GetString());
        Assert.True(body.TryGetProperty("traceId", out _) || body.TryGetProperty("instance", out _));
    }

    // ---- NFR-SEC-003 rate limit headers ----

    [Fact]
    public async Task NormalRequests_CarryRateLimitHeaders_AndRemainingDecreases()
    {
        var client = factory.NewClient();

        var first = await client.GetAsync("/api/v1/categories");
        var second = await client.GetAsync("/api/v1/categories");

        Assert.Equal("100", first.Headers.GetValues("X-RateLimit-Limit").Single());
        var remainingFirst = int.Parse(first.Headers.GetValues("X-RateLimit-Remaining").Single());
        var remainingSecond = int.Parse(second.Headers.GetValues("X-RateLimit-Remaining").Single());
        Assert.True(remainingSecond < remainingFirst);
        Assert.True(long.Parse(first.Headers.GetValues("X-RateLimit-Reset").Single()) > DateTimeOffset.UtcNow.ToUnixTimeSeconds() - 1);
    }

    [Fact]
    public async Task HealthEndpoints_AreNotRateLimited()
    {
        var client = factory.NewClient();
        for (var i = 0; i < 120; i++)
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
    }

    // ---- Users (admin) ----

    [Fact]
    public async Task Users_List_IsAdminOnly()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/v1/users?page=1&pageSize=5")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await author.GetAsync("/api/v1/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.NewClient().GetAsync("/api/v1/users")).StatusCode);
    }

    [Fact]
    public async Task Users_AdminCanLockAccount_WhichThenCannotLogIn()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var target = await factory.RegisterAuthorAsync();

        var lockResponse = await admin.PatchAsJsonAsync($"/api/v1/users/{target.Id}/status", new { isLocked = true });
        Assert.True(lockResponse.IsSuccessStatusCode, lockResponse.StatusCode.ToString());

        var login = await factory.NewClient().PostAsJsonAsync("/api/v1/auth/login", new { email = target.Email, password = ApiFactory.Password });
        Assert.True(login.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized, login.StatusCode.ToString());
    }

    [Fact]
    public async Task Users_RoleChange_IsRejectedForInvalidRole()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var target = await factory.RegisterAuthorAsync();

        var response = await admin.PatchAsJsonAsync($"/api/v1/users/{target.Id}/role", new { role = "SuperUser" });

        Assert.True(response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.UnprocessableEntity, response.StatusCode.ToString());
    }

    // ---- Newsletter ----

    [Fact]
    public async Task Newsletter_Subscribe_AcceptsValidEmail_IsIdempotent_AndRejectsInvalid()
    {
        var client = factory.NewClient();
        var email = $"news-{Guid.NewGuid():N}@example.com";

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/v1/subscriptions", new { email })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/v1/subscriptions", new { email })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await client.PostAsJsonAsync("/api/v1/subscriptions", new { email = "sai-dinh-dang" })).StatusCode);
    }

    [Fact]
    public async Task Newsletter_MySubscription_CanBeToggled_ByLoggedInUser()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient(user.AccessToken);

        Assert.False((await client.GetFromJsonAsync<JsonElement>("/api/v1/subscriptions/me")).GetProperty("subscribed").GetBoolean());
        Assert.True((await (await client.PutAsync("/api/v1/subscriptions/me", null)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("subscribed").GetBoolean());
        Assert.True((await client.GetFromJsonAsync<JsonElement>("/api/v1/subscriptions/me")).GetProperty("subscribed").GetBoolean());
        Assert.False((await (await client.DeleteAsync("/api/v1/subscriptions/me")).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("subscribed").GetBoolean());
    }

    [Fact]
    public async Task Newsletter_MySubscription_RequiresLogin() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.NewClient().GetAsync("/api/v1/subscriptions/me")).StatusCode);

    // ---- Admin jobs ----

    [Fact]
    public async Task AdminJobs_AreAdminOnly()
    {
        var author = factory.NewClient((await factory.RegisterAuthorAsync()).AccessToken);

        Assert.Equal(HttpStatusCode.Forbidden, (await author.GetAsync("/api/v1/admin/jobs")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.NewClient().GetAsync("/api/v1/admin/jobs")).StatusCode);
    }

    [Fact]
    public async Task AdminJobs_ListShowsCatalogWithSchedule()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);

        var jobs = await admin.GetFromJsonAsync<JsonElement>("/api/v1/admin/jobs");

        var ids = jobs.EnumerateArray().Select(job => job.GetProperty("id").GetString()).ToList();
        Assert.Contains("weekly-newsletter", ids);
        Assert.Contains("sitemap-generation", ids);
    }

    [Fact]
    public async Task AdminJobs_RunNow_QueuesTheJob_AndUnknownJobReturns404()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);
        var before = factory.Jobs.Jobs.Count(job => job.Type == typeof(SitemapJob));

        var run = await admin.PostAsJsonAsync("/api/v1/admin/jobs/sitemap-generation/run", new { onlyMe = false });

        Assert.Equal(HttpStatusCode.Accepted, run.StatusCode);
        Assert.Equal(before + 1, factory.Jobs.Jobs.Count(job => job.Type == typeof(SitemapJob)));
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsJsonAsync("/api/v1/admin/jobs/khong-co/run", new { onlyMe = false })).StatusCode);
    }

    [Fact]
    public async Task AdminJobs_TestSend_GoesOnlyToTheAdmin()
    {
        var adminUser = await factory.RegisterAdminAsync();
        var admin = factory.NewClient(adminUser.AccessToken);

        Assert.Equal(HttpStatusCode.Accepted, (await admin.PostAsJsonAsync("/api/v1/admin/jobs/weekly-newsletter/run", new { onlyMe = true })).StatusCode);

        var args = factory.Jobs.LastArguments(typeof(NewsletterDigestJob), nameof(NewsletterDigestJob.SendToAsync));
        Assert.Equal(adminUser.Email, args[0]);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/v1/admin/jobs/sitemap-generation/run", new { onlyMe = true })).StatusCode);
    }

    [Fact]
    public async Task AdminJobs_ScheduleOnce_RejectsPastAndMalformedTimes()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity,
            (await admin.PostAsJsonAsync("/api/v1/admin/jobs/weekly-newsletter/schedule-once", new { runAt = "2020-01-01T08:00" })).StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity,
            (await admin.PostAsJsonAsync("/api/v1/admin/jobs/weekly-newsletter/schedule-once", new { runAt = "ngày mai" })).StatusCode);

        var future = DateTime.UtcNow.AddHours(7).AddDays(2).ToString("yyyy-MM-dd'T'HH:mm");
        Assert.Equal(HttpStatusCode.OK,
            (await admin.PostAsJsonAsync("/api/v1/admin/jobs/weekly-newsletter/schedule-once", new { runAt = future })).StatusCode);
    }

    [Fact]
    public async Task AdminJobs_UpdateSchedule_PersistsInVietnamTime_AndValidatesRange()
    {
        var admin = factory.NewClient((await factory.RegisterAdminAsync()).AccessToken);

        var ok = await admin.PutAsJsonAsync("/api/v1/admin/jobs/weekly-newsletter/schedule", new { dayOfWeek = 3, hour = 9, minute = 30 });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var schedule = (await ok.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("schedule");
        Assert.Equal(3, schedule.GetProperty("dayOfWeek").GetInt32());
        Assert.Equal(9, schedule.GetProperty("hour").GetInt32());
        Assert.Equal(30, schedule.GetProperty("minute").GetInt32());

        Assert.Equal(HttpStatusCode.UnprocessableEntity,
            (await admin.PutAsJsonAsync("/api/v1/admin/jobs/weekly-newsletter/schedule", new { dayOfWeek = 1, hour = 30, minute = 0 })).StatusCode);
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

namespace CulinaryBlog.Tests.Integration;

[Collection(ApiCollection.Name)]
public sealed class AuthApiTests(ApiFactory factory)
{
    private const string Base = "/api/v1/auth";

    private static object NewRegistration(string email, string password = ApiFactory.Password) =>
        new { fullName = "Người Dùng Thử", email, userName = $"u{Guid.NewGuid():N}"[..20], password };

    // ---- FR-AUTH-001 register ----

    [Fact]
    public async Task Register_ValidRequest_Returns201WithTokensAndAuthorRole()
    {
        var response = await factory.NewClient().PostAsJsonAsync($"{Base}/register", NewRegistration($"a-{Guid.NewGuid():N}@example.com"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("accessToken").GetString()));
        Assert.False(string.IsNullOrEmpty(body.GetProperty("refreshToken").GetString()));
        Assert.Contains("Author", body.GetProperty("user").GetProperty("roles").EnumerateArray().Select(role => role.GetString()));
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var user = await factory.RegisterAsync();

        var response = await factory.NewClient().PostAsJsonAsync($"{Base}/register", NewRegistration(user.Email));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Register_WeakPassword_Returns422WithPasswordError()
    {
        var response = await factory.NewClient().PostAsJsonAsync($"{Base}/register", NewRegistration($"w-{Guid.NewGuid():N}@example.com", "abc"));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("errors").TryGetProperty("password", out _));
    }

    // ---- FR-AUTH-002 login ----

    [Fact]
    public async Task Login_WrongPassword_Returns401WithoutRevealingWhichFieldIsWrong()
    {
        var user = await factory.RegisterAsync();

        var response = await factory.NewClient().PostAsJsonAsync($"{Base}/login", new { email = user.Email, password = "Wrong@1234" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401LikeWrongPassword()
    {
        var response = await factory.NewClient().PostAsJsonAsync($"{Base}/login", new { email = "ghost@example.com", password = ApiFactory.Password });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_AfterFiveWrongPasswords_LocksAccountWith403()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient();
        for (var i = 0; i < 5; i++)
            await client.PostAsJsonAsync($"{Base}/login", new { email = user.Email, password = "Wrong@1234" });

        var response = await client.PostAsJsonAsync($"{Base}/login", new { email = user.Email, password = ApiFactory.Password });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ---- FR-AUTH-004 refresh, FR-AUTH-005 logout ----

    [Fact]
    public async Task Refresh_RotatesTokenAndRejectsReuseOfTheOldOne()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient();

        var first = await client.PostAsJsonAsync($"{Base}/refresh", new { refreshToken = user.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var rotated = (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("refreshToken").GetString();
        Assert.NotEqual(user.RefreshToken, rotated);

        var reuse = await client.PostAsJsonAsync($"{Base}/refresh", new { refreshToken = user.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);

        // Phát hiện dùng lại token cũ thu hồi cả chuỗi: token mới cũng không còn dùng được.
        var afterReuse = await client.PostAsJsonAsync($"{Base}/refresh", new { refreshToken = rotated });
        Assert.Equal(HttpStatusCode.Unauthorized, afterReuse.StatusCode);
    }

    [Fact]
    public async Task Refresh_GarbageToken_Returns401() =>
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await factory.NewClient().PostAsJsonAsync($"{Base}/refresh", new { refreshToken = "garbage" })).StatusCode);

    [Fact]
    public async Task Logout_RevokesRefreshTokenAndIsIdempotent()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient(user.AccessToken);

        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"{Base}/logout", new { refreshToken = user.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"{Base}/logout", new { refreshToken = user.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync($"{Base}/refresh", new { refreshToken = user.RefreshToken })).StatusCode);
    }

    [Fact]
    public async Task Logout_WithoutBearer_Returns401() =>
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await factory.NewClient().PostAsJsonAsync($"{Base}/logout", new { refreshToken = "x" })).StatusCode);

    // ---- FR-AUTH-006/007 profile ----

    [Fact]
    public async Task Me_WithToken_ReturnsProfileWithoutSecrets()
    {
        var user = await factory.RegisterAsync();

        var response = await factory.NewClient(user.AccessToken).GetAsync($"{Base}/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var text = await response.Content.ReadAsStringAsync();
        Assert.Contains(user.Email, text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("passwordHash", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("securityStamp", text, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.NewClient().GetAsync($"{Base}/me")).StatusCode);

    [Fact]
    public async Task UpdateMe_ChangesNameAndBio_AndRejectsTooShortName()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient(user.AccessToken);

        var ok = await client.PatchAsJsonAsync($"{Base}/me", new { fullName = "Tên Mới", bio = "Mê nấu ăn" });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var profile = await (await client.GetAsync($"{Base}/me")).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Tên Mới", profile.GetProperty("fullName").GetString());
        Assert.Equal("Mê nấu ăn", profile.GetProperty("bio").GetString());

        var bad = await client.PatchAsJsonAsync($"{Base}/me", new { fullName = "A" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, bad.StatusCode);
    }

    [Fact]
    public async Task UploadAvatar_ValidPng_SetsAvatarUrl_AndRejectsNonImage()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient(user.AccessToken);

        using var form = new MultipartFormDataContent { { ApiFactory.PngFile(), "file", "a.png" } };
        var ok = await client.PostAsync($"{Base}/me/avatar", form);
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        Assert.StartsWith("http", (await ok.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("avatarUrl").GetString());

        var fake = new ByteArrayContent("không phải ảnh"u8.ToArray());
        fake.Headers.ContentType = new("image/png");
        using var badForm = new MultipartFormDataContent { { fake, "file", "a.png" } };
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await client.PostAsync($"{Base}/me/avatar", badForm)).StatusCode);
    }

    // ---- password flows ----

    [Fact]
    public async Task ChangePassword_WrongCurrent_Returns422_ThenSuccessRevokesSessions()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient(user.AccessToken);

        var wrong = await client.PostAsJsonAsync($"{Base}/change-password", new { currentPassword = "Wrong@1234", newPassword = "Newpass@1234" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, wrong.StatusCode);

        var ok = await client.PostAsJsonAsync($"{Base}/change-password", new { currentPassword = ApiFactory.Password, newPassword = "Newpass@1234" });
        Assert.Equal(HttpStatusCode.NoContent, ok.StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized,
            (await factory.NewClient().PostAsJsonAsync($"{Base}/refresh", new { refreshToken = user.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await factory.NewClient().PostAsJsonAsync($"{Base}/login", new { email = user.Email, password = "Newpass@1234" })).StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WithoutToken_Returns401() =>
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await factory.NewClient().PostAsJsonAsync($"{Base}/change-password", new { currentPassword = "a", newPassword = "b" })).StatusCode);

    [Fact]
    public async Task ForgotAndResetPassword_FullFlow_UsingTokenFromQueuedEmail()
    {
        var user = await factory.RegisterAsync();
        var client = factory.NewClient();

        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"{Base}/forgot-password", new { email = user.Email })).StatusCode);
        var args = factory.Jobs.LastArguments(typeof(PasswordResetEmailJob), nameof(PasswordResetEmailJob.SendAsync));
        Assert.Equal(user.Email, args[0]);
        var token = (string)args[3]!;

        var bad = await client.PostAsJsonAsync($"{Base}/reset-password", new { email = user.Email, token = "invalid", newPassword = "Reset@12345" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, bad.StatusCode);

        var ok = await client.PostAsJsonAsync($"{Base}/reset-password", new { email = user.Email, token, newPassword = "Reset@12345" });
        Assert.Equal(HttpStatusCode.NoContent, ok.StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await client.PostAsJsonAsync($"{Base}/login", new { email = user.Email, password = "Reset@12345" })).StatusCode);

        // Token chỉ dùng được một lần.
        var reuse = await client.PostAsJsonAsync($"{Base}/reset-password", new { email = user.Email, token, newPassword = "Other@12345" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, reuse.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_UnknownEmail_StillReturns204()
    {
        var response = await factory.NewClient().PostAsJsonAsync($"{Base}/forgot-password", new { email = "nobody@example.com" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_InvalidEmail_Returns422() =>
        Assert.Equal(HttpStatusCode.UnprocessableEntity,
            (await factory.NewClient().PostAsJsonAsync($"{Base}/forgot-password", new { email = "not-an-email" })).StatusCode);

    // ---- email confirmation ----

    [Fact]
    public async Task ConfirmEmail_WithTokenFromWelcomeEmail_Succeeds_AndInvalidTokenFails()
    {
        var user = await factory.RegisterAsync();
        var args = factory.Jobs.Jobs.Reverse()
            .First(job => job.Type == typeof(WelcomeEmailJob) && (string)job.Args[0]! == user.Email).Args;
        var client = factory.NewClient();

        var bad = await client.GetAsync($"{Base}/confirm-email?userId={Uri.EscapeDataString(user.Id)}&token=bad");
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);

        var ok = await client.GetAsync($"{Base}/confirm-email?userId={Uri.EscapeDataString((string)args[2]!)}&token={Uri.EscapeDataString((string)args[3]!)}");
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
    }

    // ---- NFR-SEC-003 rate limit ----

    [Fact]
    public async Task AuthEndpoints_AreLimitedToTenRequestsPerMinute_With429AndRetryAfter()
    {
        var client = factory.NewClient();
        HttpResponseMessage? last = null;
        for (var i = 0; i < 11; i++)
            last = await client.PostAsJsonAsync($"{Base}/login", new { email = "ghost@example.com", password = "x" });

        Assert.Equal(HttpStatusCode.TooManyRequests, last!.StatusCode);
        Assert.True(last.Headers.Contains("Retry-After"));
        Assert.True(last.Headers.Contains("X-RateLimit-Remaining"));
    }
}

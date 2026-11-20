using System.Security.Claims;
using System.Text;
using CulinaryBlog.Engagement;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key phải có tối thiểu 32 ký tự.");

builder.Services.AddDbContext<EngagementDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHttpClient<RecipeClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["RecipeApiUrl"] ?? "http://localhost:5000/");
    client.Timeout = TimeSpan.FromSeconds(5);
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "CulinaryBlog",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "CulinaryBlog.Client",
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
        NameClaimType = "sub",
        RoleClaimType = "role"
    };
});
builder.Services.AddAuthorization();
builder.Services.AddHealthChecks().AddDbContextCheck<EngagementDbContext>();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

await using (var scope = app.Services.CreateAsyncScope())
    await scope.ServiceProvider.GetRequiredService<EngagementDbContext>().Database.MigrateAsync();

app.MapHealthChecks("/health");

var saved = app.MapGroup("/api/v1/saved-recipes").RequireAuthorization();
saved.MapGet("/", async (int? page, int? pageSize, ClaimsPrincipal user, EngagementDbContext db, RecipeClient recipes, CancellationToken ct) =>
{
    var userId = user.UserId();
    var currentPage = Math.Max(1, page ?? 1);
    var size = Math.Clamp(pageSize ?? 10, 1, 50);
    var query = db.SavedRecipes.Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt);
    var entities = await query.Skip((currentPage - 1) * size).Take(size).ToListAsync(ct);

    // shortcut: chỉ refresh trang hiện tại (tối đa 50 recipe); dùng batch API/event khi dữ liệu lớn hơn.
    var snapshots = await Task.WhenAll(entities.Select(x => recipes.GetPublishedAsync(x.RecipeId, x.Slug, ct)));
    var activeEntities = new List<SavedRecipe>(entities.Count);
    for (var index = 0; index < entities.Count; index++)
    {
        var entity = entities[index];
        var snapshot = snapshots[index];
        if (snapshot is null)
        {
            db.SavedRecipes.Remove(entity);
            continue;
        }

        activeEntities.Add(entity);
        entity.Slug = snapshot.Slug;
        entity.Title = snapshot.Title;
        entity.Description = snapshot.Description;
        entity.PrimaryImageUrl = snapshot.PrimaryImageUrl;
        entity.TotalTimeMinutes = snapshot.TotalTimeMinutes;
    }
    await db.SaveChangesAsync(ct);

    var items = activeEntities
        .Select(x => new SavedRecipeDto(x.RecipeId, x.Slug, x.Title, x.Description, x.PrimaryImageUrl, x.TotalTimeMinutes, x.CreatedAt))
        .ToList();
    var total = await db.SavedRecipes.CountAsync(x => x.UserId == userId, ct);
    return Results.Ok(new PagedResponse<SavedRecipeDto>(items, total, currentPage, size, (int)Math.Ceiling(total / (double)size)));
});
saved.MapPut("/{recipeId:guid}", async (Guid recipeId, RecipeReferenceRequest request, ClaimsPrincipal user, RecipeClient recipes, EngagementDbContext db, CancellationToken ct) =>
{
    var recipe = await recipes.GetPublishedAsync(recipeId, request.Slug, ct);
    if (recipe is null) return Results.NotFound(new { title = "Không tìm thấy công thức đã xuất bản." });

    var now = DateTimeOffset.UtcNow;
    await db.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO saved_recipes ("UserId", "RecipeId", "Slug", "Title", "Description", "PrimaryImageUrl", "TotalTimeMinutes", "CreatedAt")
        VALUES ({user.UserId()}, {recipeId}, {recipe.Slug}, {recipe.Title}, {recipe.Description}, {recipe.PrimaryImageUrl}, {recipe.TotalTimeMinutes}, {now})
        ON CONFLICT ("UserId", "RecipeId") DO UPDATE SET
            "Slug" = EXCLUDED."Slug",
            "Title" = EXCLUDED."Title",
            "Description" = EXCLUDED."Description",
            "PrimaryImageUrl" = EXCLUDED."PrimaryImageUrl",
            "TotalTimeMinutes" = EXCLUDED."TotalTimeMinutes"
        """, ct);
    return Results.NoContent();
});
saved.MapDelete("/{recipeId:guid}", async (Guid recipeId, ClaimsPrincipal user, EngagementDbContext db, CancellationToken ct) =>
{
    await db.SavedRecipes.Where(x => x.UserId == user.UserId() && x.RecipeId == recipeId).ExecuteDeleteAsync(ct);
    return Results.NoContent();
});

var ratings = app.MapGroup("/api/v1/ratings");
ratings.MapGet("/top", async (int? limit, EngagementDbContext db, CancellationToken ct) =>
{
    var size = Math.Clamp(limit ?? 5, 1, 10);
    var aggregates = await db.Ratings.AsNoTracking()
        .GroupBy(rating => rating.RecipeId)
        .Select(group => new { RecipeId = group.Key, AverageRating = group.Average(rating => rating.Score), RatingCount = group.Count() })
        .OrderByDescending(item => item.AverageRating)
        .ThenByDescending(item => item.RatingCount)
        .Take(size)
        .ToListAsync(ct);
    var items = aggregates.Select(item => new TopRatedRecipe(item.RecipeId, item.AverageRating, item.RatingCount));
    return Results.Ok(items);
}).AllowAnonymous();
ratings.MapGet("/{recipeId:guid}", async (Guid recipeId, ClaimsPrincipal user, EngagementDbContext db, CancellationToken ct) =>
{
    var query = db.Ratings.AsNoTracking().Where(x => x.RecipeId == recipeId);
    var aggregate = await query.GroupBy(_ => 1)
        .Select(group => new { Count = group.Count(), Average = group.Average(x => x.Score) })
        .SingleOrDefaultAsync(ct);
    var count = aggregate?.Count ?? 0;
    var average = aggregate?.Average ?? 0;
    var userId = user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
    var myRating = userId is null ? null : await query.Where(x => x.UserId == userId).Select(x => (int?)x.Score).FirstOrDefaultAsync(ct);
    var isSaved = userId is not null && await db.SavedRecipes.AnyAsync(x => x.UserId == userId && x.RecipeId == recipeId, ct);
    return Results.Ok(new EngagementSummary(recipeId, Math.Round(average, 1), count, isSaved, myRating));
}).AllowAnonymous();
ratings.MapPut("/{recipeId:guid}", async (Guid recipeId, RatingRequest request, ClaimsPrincipal user, RecipeClient recipes, EngagementDbContext db, CancellationToken ct) =>
{
    if (!RecipeRating.IsValidScore(request.Score))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["score"] = ["Điểm đánh giá phải từ 1 đến 5."] });
    if (await recipes.GetPublishedAsync(recipeId, request.Slug, ct) is null)
        return Results.NotFound(new { title = "Không tìm thấy công thức đã xuất bản." });

    var now = DateTimeOffset.UtcNow;
    await db.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO recipe_ratings ("UserId", "RecipeId", "Score", "CreatedAt", "UpdatedAt")
        VALUES ({user.UserId()}, {recipeId}, {request.Score}, {now}, {now})
        ON CONFLICT ("UserId", "RecipeId") DO UPDATE SET
            "Score" = EXCLUDED."Score",
            "UpdatedAt" = EXCLUDED."UpdatedAt"
        """, ct);
    return Results.NoContent();
}).RequireAuthorization();
ratings.MapDelete("/{recipeId:guid}", async (Guid recipeId, ClaimsPrincipal user, EngagementDbContext db, CancellationToken ct) =>
{
    await db.Ratings.Where(x => x.UserId == user.UserId() && x.RecipeId == recipeId).ExecuteDeleteAsync(ct);
    return Results.NoContent();
}).RequireAuthorization();

app.Run();

static class ClaimsPrincipalExtensions
{
    public static string UserId(this ClaimsPrincipal user) =>
        user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Access token không có claim sub.");
}

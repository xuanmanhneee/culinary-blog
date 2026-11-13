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
    client.BaseAddress = new Uri(builder.Configuration["RecipeApiUrl"] ?? "http://localhost:5000/"));
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
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"])
        .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// shortcut: EnsureCreated chỉ phù hợp schema đầu tiên, thêm EF migration trước lần thay đổi schema kế tiếp.
await using (var scope = app.Services.CreateAsyncScope())
    await scope.ServiceProvider.GetRequiredService<EngagementDbContext>().Database.EnsureCreatedAsync();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

var saved = app.MapGroup("/api/v1/saved-recipes").RequireAuthorization();
saved.MapGet("/", async (int? page, int? pageSize, ClaimsPrincipal user, EngagementDbContext db, CancellationToken ct) =>
{
    var userId = user.UserId();
    var currentPage = Math.Max(1, page ?? 1);
    var size = Math.Clamp(pageSize ?? 10, 1, 50);
    var query = db.SavedRecipes.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt);
    var total = await query.CountAsync(ct);
    var items = await query.Skip((currentPage - 1) * size).Take(size)
        .Select(x => new SavedRecipeDto(x.RecipeId, x.Slug, x.Title, x.Description, x.PrimaryImageUrl, x.TotalTimeMinutes, x.CreatedAt))
        .ToListAsync(ct);
    return Results.Ok(new PagedResponse<SavedRecipeDto>(items, total, currentPage, size, (int)Math.Ceiling(total / (double)size)));
});
saved.MapPut("/{recipeId:guid}", async (Guid recipeId, RecipeReferenceRequest request, ClaimsPrincipal user, RecipeClient recipes, EngagementDbContext db, CancellationToken ct) =>
{
    var recipe = await recipes.GetPublishedAsync(recipeId, request.Slug, ct);
    if (recipe is null) return Results.NotFound(new { title = "Không tìm thấy công thức đã xuất bản." });

    var userId = user.UserId();
    var entity = await db.SavedRecipes.FindAsync([userId, recipeId], ct);
    if (entity is null)
        db.SavedRecipes.Add(new SavedRecipe { UserId = userId, RecipeId = recipeId, Slug = recipe.Slug, Title = recipe.Title, Description = recipe.Description, PrimaryImageUrl = recipe.PrimaryImageUrl, TotalTimeMinutes = recipe.TotalTimeMinutes });
    else
    {
        entity.Slug = recipe.Slug;
        entity.Title = recipe.Title;
        entity.Description = recipe.Description;
        entity.PrimaryImageUrl = recipe.PrimaryImageUrl;
        entity.TotalTimeMinutes = recipe.TotalTimeMinutes;
    }
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
});
saved.MapDelete("/{recipeId:guid}", async (Guid recipeId, ClaimsPrincipal user, EngagementDbContext db, CancellationToken ct) =>
{
    await db.SavedRecipes.Where(x => x.UserId == user.UserId() && x.RecipeId == recipeId).ExecuteDeleteAsync(ct);
    return Results.NoContent();
});

var ratings = app.MapGroup("/api/v1/ratings");
ratings.MapGet("/{recipeId:guid}", async (Guid recipeId, ClaimsPrincipal user, EngagementDbContext db, CancellationToken ct) =>
{
    var query = db.Ratings.AsNoTracking().Where(x => x.RecipeId == recipeId);
    var count = await query.CountAsync(ct);
    var average = count == 0 ? 0 : await query.AverageAsync(x => x.Score, ct);
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

    var userId = user.UserId();
    var rating = await db.Ratings.FindAsync([userId, recipeId], ct);
    if (rating is null)
        db.Ratings.Add(new RecipeRating { UserId = userId, RecipeId = recipeId, Score = request.Score });
    else
    {
        rating.Score = request.Score;
        rating.UpdatedAt = DateTimeOffset.UtcNow;
    }
    await db.SaveChangesAsync(ct);
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

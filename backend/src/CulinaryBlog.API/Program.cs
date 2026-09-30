using CulinaryBlog.API.Endpoints;
using CulinaryBlog.Application;
using CulinaryBlog.Infrastructure;
using CulinaryBlog.Infrastructure.Persistence;
using CulinaryBlog.Infrastructure.Persistence.Seed;
using CulinaryBlog.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Keep local development logs on the console; Windows EventLog may require
// administrator permissions and can mask the original database exception.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Add OpenAPI/Swagger services
builder.Services.AddOpenApi();

builder.Services.AddApplicationServices();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddMinioStorage(builder.Configuration);

var app = builder.Build();

// Apply schema migrations on startup, but seed only when explicitly requested.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CulinaryBlogDbContext>();
    await dbContext.Database.MigrateAsync();
}

if (args.Contains("--seed", StringComparer.OrdinalIgnoreCase))
{
    await app.Services.SeedCulinaryBlogDataAsync();
    return;
}

// Bật OpenAPI & Scalar UI trong môi trường Development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Culinary Blog API")
               .WithTheme(ScalarTheme.Moon);
    });
}

// Map các Endpoints của ứng dụng
app.MapRecipesEndpoints();

app.Run();

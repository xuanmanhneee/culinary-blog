using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;

/// <summary>
/// Cho phép "dotnet ef migrations add" chạy được mà KHÔNG cần build/start toàn bộ
/// API project (Program.cs với DI, Serilog, Hangfire...). EF Core Tools tự tìm
/// class implement IDesignTimeDbContextFactory trong project khi generate migration.
/// Đọc connection string từ appsettings.json của project API (copy sang đây lúc design-time).
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<CulinaryBlogDbContext>
{
    public CulinaryBlogDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            // Khi chạy lệnh dotnet ef từ project Infrastructure, dùng --startup-project
            // trỏ sang API để tìm đúng appsettings. Chuỗi dưới là fallback cho dev local.
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=culinaryblog;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<CulinaryBlogDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsAssembly(typeof(CulinaryBlogDbContext).Assembly.FullName));

        return new CulinaryBlogDbContext(optionsBuilder.Options);
    }
}

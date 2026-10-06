using System.Linq.Expressions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Domain.Modules.Recipes;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Infrastructure.Persistence;

/// <summary>
/// DbContext duy nhất của modular monolith. Mỗi module "đăng ký" DbSet + Configuration
/// của mình vào đây. Đây là điểm ghép nối bắt buộc phải có trong 1 database dùng chung;
/// khi tách microservice, module nào tách ra sẽ mang theo Configuration của module đó
/// sang một DbContext/DB riêng.
/// </summary>
public class CulinaryBlogDbContext : IdentityDbContext<ApplicationUser>
{
    public CulinaryBlogDbContext(DbContextOptions<CulinaryBlogDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeStep> RecipeSteps => Set<RecipeStep>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeImage> RecipeImages => Set<RecipeImage>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder); // áp dụng cấu hình Identity (AspNetUsers, AspNetRoles...)

        // Tự động load mọi IEntityTypeConfiguration<T> trong assembly Infrastructure
        // (mỗi module tự khai báo Configuration của mình, DbContext không cần biết chi tiết)
        builder.ApplyConfigurationsFromAssembly(typeof(CulinaryBlogDbContext).Assembly);
        
        foreach (var entityType in builder.Model.GetEntityTypes()
                     .Where(t => typeof(BaseEntity).IsAssignableFrom(t.ClrType)))
        {
            var param = Expression.Parameter(entityType.ClrType, "e");
            var isNotDeleted = Expression.Lambda(
                Expression.Equal(Expression.Property(param, nameof(BaseEntity.IsDeleted)), Expression.Constant(false)),
                param);
            entityType.SetQueryFilter(isNotDeleted);
        }
    }
}

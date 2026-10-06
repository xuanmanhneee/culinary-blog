using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CulinaryBlog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RecipeAppManagedRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Schema không đổi: RowVersion của Recipe chuyển từ "DB sinh" sang "ứng dụng sinh"
            // (AuditInterceptor). Các dòng cũ đang rỗng nên cấp token ban đầu để If-Match dùng được.
            migrationBuilder.Sql(
                """
                UPDATE "Recipes"
                SET "RowVersion" = decode(md5(random()::text || "Id"::text), 'hex')
                WHERE length("RowVersion") = 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}

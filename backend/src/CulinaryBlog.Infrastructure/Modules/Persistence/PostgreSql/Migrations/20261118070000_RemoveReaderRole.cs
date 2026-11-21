using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Migrations;

[DbContext(typeof(CulinaryBlogDbContext))]
[Migration("20261118070000_RemoveReaderRole")]
public sealed class RemoveReaderRole : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
            SELECT gen_random_uuid()::text, 'Author', 'AUTHOR', gen_random_uuid()::text
            WHERE EXISTS (SELECT 1 FROM "AspNetRoles" WHERE "NormalizedName" = 'READER')
            ON CONFLICT ("NormalizedName") DO NOTHING;

            INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
            SELECT membership."UserId", author."Id"
            FROM "AspNetUserRoles" AS membership
            JOIN "AspNetRoles" AS reader ON reader."Id" = membership."RoleId"
            CROSS JOIN "AspNetRoles" AS author
            WHERE reader."NormalizedName" = 'READER'
              AND author."NormalizedName" = 'AUTHOR'
              AND NOT EXISTS (
                  SELECT 1
                  FROM "AspNetUserRoles" AS existing
                  JOIN "AspNetRoles" AS role ON role."Id" = existing."RoleId"
                  WHERE existing."UserId" = membership."UserId"
                    AND role."NormalizedName" IN ('ADMIN', 'AUTHOR')
              );

            DELETE FROM "AspNetRoles" WHERE "NormalizedName" = 'READER';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        throw new NotSupportedException("Restore the previous role assignments from a backup to roll back this data migration.");
}

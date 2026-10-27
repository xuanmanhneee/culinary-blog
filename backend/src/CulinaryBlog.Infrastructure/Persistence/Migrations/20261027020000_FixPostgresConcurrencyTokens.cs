using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CulinaryBlog.Infrastructure.Persistence.Migrations;

[DbContext(typeof(CulinaryBlogDbContext))]
[Migration("20261027020000_FixPostgresConcurrencyTokens")]
public partial class FixPostgresConcurrencyTokens : Migration
{
    private static readonly string[] Tables =
    [
        "Categories",
        "Recipes",
        "RecipeImages",
        "RecipeIngredients",
        "RecipeSteps"
    ];

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var table in Tables)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                table: table,
                type: "bytea",
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true,
                oldDefaultValueSql: "decode('', 'hex')");
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        foreach (var table in Tables)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "RowVersion",
                table: table,
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValueSql: "decode('', 'hex')",
                oldClrType: typeof(byte[]),
                oldType: "bytea");
        }
    }
}

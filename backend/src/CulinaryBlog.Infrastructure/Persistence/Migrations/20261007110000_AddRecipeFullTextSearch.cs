using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace CulinaryBlog.Infrastructure.Persistence.Migrations;

[DbContext(typeof(CulinaryBlogDbContext))]
[Migration("20261007110000_AddRecipeFullTextSearch")]
public partial class AddRecipeFullTextSearch : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS unaccent;");
        migrationBuilder.Sql(
            "CREATE TEXT SEARCH DICTIONARY vietnamese_unaccent (TEMPLATE = unaccent, RULES = 'unaccent');");
        migrationBuilder.Sql("CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);");
        migrationBuilder.Sql(
            "ALTER TEXT SEARCH CONFIGURATION vietnamese " +
            "ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part " +
            "WITH vietnamese_unaccent, simple;");
        migrationBuilder.Sql(
            "ALTER TABLE \"Recipes\" ADD COLUMN \"SearchVector\" tsvector " +
            "GENERATED ALWAYS AS (to_tsvector('vietnamese'::regconfig, " +
            "COALESCE(\"Title\", '') || ' ' || COALESCE(\"Description\", '') || ' ' || COALESCE(\"Instructions\", ''))) STORED;");
        migrationBuilder.Sql(
            "CREATE INDEX \"IX_Recipes_SearchVector\" ON \"Recipes\" USING GIN (\"SearchVector\");");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP INDEX \"IX_Recipes_SearchVector\";");
        migrationBuilder.Sql("ALTER TABLE \"Recipes\" DROP COLUMN \"SearchVector\";");
        migrationBuilder.Sql("DROP TEXT SEARCH CONFIGURATION vietnamese;");
        migrationBuilder.Sql("DROP TEXT SEARCH DICTIONARY vietnamese_unaccent;");
    }
}

using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CulinaryBlog.Infrastructure.Persistence.Migrations;

[DbContext(typeof(CulinaryBlogDbContext))]
[Migration("20261027000000_AddFuzzyRecipeSearch")]
public partial class AddFuzzyRecipeSearch : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS unaccent;");
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

        // PostgreSQL marks unaccent() as STABLE. The immutable wrapper allows it in a
        // stored generated column and keeps the normalized text indexable by pg_trgm.
        migrationBuilder.Sql(
            """
            CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
            RETURNS text
            LANGUAGE sql
            IMMUTABLE
            PARALLEL SAFE
            STRICT
            AS $function$
                SELECT public.unaccent('public.unaccent', $1)
            $function$;
            """);

        migrationBuilder.AddColumn<string>(
            name: "SearchTextNormalized",
            table: "Recipes",
            type: "text",
            nullable: true,
            computedColumnSql:
                "public.immutable_unaccent(lower(coalesce(\"Title\", '') || ' ' || coalesce(\"Description\", '')))",
            stored: true);

        migrationBuilder.Sql(
            """
            CREATE INDEX "IDX_Recipe_SearchTextNormalized_Trgm"
            ON "Recipes" USING gin ("SearchTextNormalized" gin_trgm_ops);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IDX_Recipe_SearchTextNormalized_Trgm",
            table: "Recipes");

        migrationBuilder.DropColumn(
            name: "SearchTextNormalized",
            table: "Recipes");

        migrationBuilder.Sql("DROP FUNCTION IF EXISTS public.immutable_unaccent(text);");
    }
}

using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeSearchVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $migration$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'Recipes' AND column_name = 'SearchVector'
                    ) THEN
                        ALTER TABLE "Recipes" ADD COLUMN "SearchVector" tsvector 
                            GENERATED ALWAYS AS (to_tsvector('simple', coalesce("Title", '') || ' ' || coalesce("Description", ''))) STORED;
                    END IF;

                    IF to_regclass('public."IDX_Recipe_SearchVector"') IS NULL
                       AND to_regclass('public."IX_Recipes_SearchVector"') IS NOT NULL THEN
                        ALTER INDEX public."IX_Recipes_SearchVector" RENAME TO "IDX_Recipe_SearchVector";
                    ELSIF to_regclass('public."IDX_Recipe_SearchVector"') IS NULL THEN
                        CREATE INDEX "IDX_Recipe_SearchVector" ON "Recipes" USING GIN ("SearchVector");
                    END IF;
                END
                $migration$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $migration$
                BEGIN
                    IF to_regclass('public."IX_Recipes_SearchVector"') IS NULL
                       AND to_regclass('public."IDX_Recipe_SearchVector"') IS NOT NULL THEN
                        ALTER INDEX public."IDX_Recipe_SearchVector" RENAME TO "IX_Recipes_SearchVector";
                    END IF;
                END
                $migration$;
                """);
        }
    }
}

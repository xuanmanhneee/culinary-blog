using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CulinaryBlog.Engagement.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // IF NOT EXISTS adopts databases created by the previous EnsureCreated startup path without dropping data.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS recipe_ratings (
                    "UserId" character varying(450) NOT NULL,
                    "RecipeId" uuid NOT NULL,
                    "Score" integer NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_recipe_ratings" PRIMARY KEY ("UserId", "RecipeId"),
                    CONSTRAINT "CK_recipe_ratings_score" CHECK ("Score" BETWEEN 1 AND 5)
                );

                CREATE TABLE IF NOT EXISTS saved_recipes (
                    "UserId" character varying(450) NOT NULL,
                    "RecipeId" uuid NOT NULL,
                    "Slug" character varying(200) NOT NULL,
                    "Title" character varying(200) NOT NULL,
                    "Description" character varying(2000) NOT NULL,
                    "PrimaryImageUrl" character varying(2048),
                    "TotalTimeMinutes" integer NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_saved_recipes" PRIMARY KEY ("UserId", "RecipeId")
                );

                CREATE INDEX IF NOT EXISTS "IX_recipe_ratings_RecipeId"
                    ON recipe_ratings ("RecipeId");
                CREATE INDEX IF NOT EXISTS "IX_saved_recipes_UserId_CreatedAt"
                    ON saved_recipes ("UserId", "CreatedAt");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "recipe_ratings");

            migrationBuilder.DropTable(
                name: "saved_recipes");
        }
    }
}

using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Tests.Recipes;

public sealed class RecipeAuthorizationHandlerTests
{
    private static readonly Recipe OtherAuthorsRecipe = Recipe.Create(
        "Phở bò", "pho-bo", "Mô tả", "Hướng dẫn", Guid.NewGuid(), "author-id",
        10, 60, 4, RecipeDifficulty.Medium);

    [Fact]
    public void Admin_CannotModifyAnotherAuthorsRecipe()
    {
        var authorization = new RecipeAuthorizationHandler(new CurrentUser("admin-id", IsAdmin: true));

        Assert.Throws<ForbiddenException>(() => authorization.EnsureCanModify(OtherAuthorsRecipe));
    }

    [Fact]
    public void Admin_CanModerateAnotherAuthorsRecipe()
    {
        var authorization = new RecipeAuthorizationHandler(new CurrentUser("admin-id", IsAdmin: true));

        authorization.EnsureCanModerate(OtherAuthorsRecipe);
    }

    [Fact]
    public void Owner_CanModifyTheirRecipe()
    {
        var authorization = new RecipeAuthorizationHandler(new CurrentUser("author-id"));

        authorization.EnsureCanModify(OtherAuthorsRecipe);
    }

    [Fact]
    public void AnotherAuthor_CannotRestoreRecipe()
    {
        var authorization = new RecipeAuthorizationHandler(new CurrentUser("another-author-id"));

        Assert.Throws<ForbiddenException>(() => authorization.EnsureCanModerate(OtherAuthorsRecipe));
    }

    [Fact]
    public void Restore_ClearsSoftDeleteFlag()
    {
        var recipe = Recipe.Create(
            "Bún bò", "bun-bo", "Mô tả", "Hướng dẫn", Guid.NewGuid(), "author-id",
            10, 60, 4, RecipeDifficulty.Medium);
        recipe.SoftDelete();

        recipe.Restore();

        Assert.False(recipe.IsDeleted);
    }

    private sealed record CurrentUser(string? UserId, bool IsAdmin = false, bool IsEmailConfirmed = true)
        : ICurrentUserService;
}

namespace CulinaryBlog.Domain.Common.Exceptions;

public static class ErrorCodes
{
    public const string ValidationError = "VALIDATION_ERROR";

    public const string RecipeNotFound = "RECIPE_NOT_FOUND";
    public const string RecipeForbidden = "RECIPE_FORBIDDEN";
    public const string RecipePublishIncomplete = "RECIPE_PUBLISH_INCOMPLETE";
    public const string RecipeConcurrencyConflict = "RECIPE_CONCURRENCY_CONFLICT";

    public const string CategoryNotFound = "CATEGORY_NOT_FOUND";
    public const string CategoryNameExists = "CATEGORY_NAME_EXISTS";
    public const string CategoryDeleteHasRecipes = "CATEGORY_DELETE_HAS_RECIPES";
    public const string CategorySlugExists = "CATEGORY_SLUG_EXISTS";

    public const string AuthEmailExists = "AUTH_EMAIL_EXISTS";
    public const string AuthInvalidCredentials = "AUTH_INVALID_CREDENTIALS";
    
    public const string IngredientNotFound = "INGREDIENT_NOT_FOUND";
    public const string IngredientNameRequired = "INGREDIENT_NAME_REQUIRED";
    public const string IngredientQuantityInvalid = "INGREDIENT_QUANTITY_INVALID";
    public const string IngredientOrderIndexInvalid = "INGREDIENT_ORDER_INDEX_INVALID";
    
    public const string RecipeSlugExists = "RECIPE_SLUG_EXISTS";
}
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

public sealed class RecipeIngredientService : IRecipeIngredientService
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public RecipeIngredientService(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
    }

    public async Task<RecipeIngredientDto> AddAsync(
        Guid recipeId,
        CreateIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request.Name, request.Quantity, request.Unit, request.Notes, request.OrderIndex);

        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        var ingredient = recipe.AddIngredient(
            request.Name.Trim(),
            request.Quantity,
            RecipeValidation.NullIfBlank(request.Unit),
            RecipeValidation.NullIfBlank(request.Notes),
            request.OrderIndex);
        _recipes.AddIngredient(ingredient);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(ingredient);
    }

    public async Task<RecipeIngredientDto> UpdateAsync(
        Guid recipeId,
        Guid ingredientId,
        UpdateIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request.Name, request.Quantity, request.Unit, request.Notes, request.OrderIndex);

        var recipe = await GetRecipeAsync(recipeId, cancellationToken);
        var ingredient = recipe.FindIngredient(ingredientId)
            ?? throw new NotFoundException(ErrorCodes.IngredientNotFound, $"Ingredient '{ingredientId}' không tồn tại.");

        ingredient.Update(
            request.Name.Trim(),
            request.Quantity,
            RecipeValidation.NullIfBlank(request.Unit),
            request.OrderIndex,
            RecipeValidation.NullIfBlank(request.Notes));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(ingredient);
    }

    public async Task DeleteAsync(
        Guid recipeId,
        Guid ingredientId,
        CancellationToken cancellationToken = default)
    {
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        if (!recipe.RemoveIngredient(ingredientId))
            // Ingredient
            throw new NotFoundException( ErrorCodes.IngredientNotFound, $"Ingredient '{ingredientId}' không tồn tại.");

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }   

    /// <summary>Load recipe rồi kiểm tra quyền: chỉ owner hoặc Admin được sửa (NFR-SEC-006).</summary>
    private async Task<Recipe> GetRecipeAsync(Guid recipeId, CancellationToken cancellationToken)
    {
        var recipe = await _recipes.GetByIdWithIngredientsAsync(recipeId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe '{recipeId}' không tồn tại.");

        _authorization.EnsureCanModify(recipe);
        return recipe;
    }

    private static void Validate(string? name, decimal? quantity, string? unit, string? notes, int? orderIndex)
    {
        var errors = new Dictionary<string, string[]>();
        RecipeValidation.ValidateIngredient(errors, string.Empty, name, quantity, unit, notes, orderIndex);

        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    private static RecipeIngredientDto Map(RecipeIngredient ingredient) => new(
        ingredient.Id,
        ingredient.Name,
        ingredient.Quantity,
        ingredient.Unit,
        ingredient.Notes,
        ingredient.OrderIndex);
}

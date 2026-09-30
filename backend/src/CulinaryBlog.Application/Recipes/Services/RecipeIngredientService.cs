using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

public sealed class RecipeIngredientService : IRecipeIngredientService
{
    // Giới hạn theo FR-RCP-009 (Name 1–100) và cột DB (Unit 50, Notes 500).
    private const int NameMaxLength = 100;
    private const int UnitMaxLength = 50;
    private const int NotesMaxLength = 500;

    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;

    public RecipeIngredientService(IRecipeRepository recipes, IUnitOfWork unitOfWork)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
    }

    public async Task<RecipeIngredientDto> AddAsync(
        Guid recipeId,
        CreateIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request.Name, request.Quantity, request.Unit, request.Notes, request.OrderIndex);

        // TODO(FR-RCP-009): kiểm tra Owner/Admin khi module Auth hoàn thành.
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        var ingredient = recipe.AddIngredient(
            request.Name.Trim(),
            request.Quantity,
            NullIfBlank(request.Unit),
            NullIfBlank(request.Notes),
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

        // TODO(FR-RCP-009): kiểm tra Owner/Admin khi module Auth hoàn thành.
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);
        var ingredient = recipe.FindIngredient(ingredientId)
            ?? throw new NotFoundException(ErrorCodes.IngredientNotFound, $"Ingredient '{ingredientId}' không tồn tại.");

        ingredient.Update(
            request.Name.Trim(),
            request.Quantity,
            NullIfBlank(request.Unit),
            request.OrderIndex,
            NullIfBlank(request.Notes));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(ingredient);
    }

    public async Task DeleteAsync(
        Guid recipeId,
        Guid ingredientId,
        CancellationToken cancellationToken = default)
    {
        // TODO(FR-RCP-009): kiểm tra Owner/Admin khi module Auth hoàn thành.
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        if (!recipe.RemoveIngredient(ingredientId))
            // Ingredient
            throw new NotFoundException( ErrorCodes.IngredientNotFound, $"Ingredient '{ingredientId}' không tồn tại.");

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }   

    private async Task<Recipe> GetRecipeAsync(Guid recipeId, CancellationToken cancellationToken) =>
        await _recipes.GetByIdWithIngredientsAsync(recipeId, cancellationToken)
            ?? throw new NotFoundException( ErrorCodes.RecipeNotFound, $"Recipe '{recipeId}' không tồn tại.");

    private static void Validate(string? name, decimal? quantity, string? unit, string? notes, int? orderIndex)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(name))
            errors["name"] = ["Tên nguyên liệu là bắt buộc."];
        else if (name.Trim().Length > NameMaxLength)
            errors["name"] = [$"Tên nguyên liệu tối đa {NameMaxLength} ký tự."];

        // Quantity null = "vừa đủ"; phân số như 1/2 được client gửi dạng 0.5.
        if (quantity is <= 0)
            errors["quantity"] = ["Số lượng phải lớn hơn 0."];

        if (unit?.Trim().Length > UnitMaxLength)
            errors["unit"] = [$"Đơn vị tối đa {UnitMaxLength} ký tự."];

        if (notes?.Trim().Length > NotesMaxLength)
            errors["notes"] = [$"Ghi chú tối đa {NotesMaxLength} ký tự."];

        if (orderIndex is < 0)
            errors["orderIndex"] = ["Thứ tự hiển thị không được âm."];

        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static RecipeIngredientDto Map(RecipeIngredient ingredient) => new(
        ingredient.Id,
        ingredient.Name,
        ingredient.Quantity,
        ingredient.Unit,
        ingredient.Notes,
        ingredient.OrderIndex);
}

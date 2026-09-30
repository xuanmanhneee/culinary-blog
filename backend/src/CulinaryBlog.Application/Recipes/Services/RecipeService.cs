using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

public sealed class RecipeService : IRecipeService
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;

    public RecipeService(IRecipeRepository recipes, IUnitOfWork unitOfWork)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<RecipeListItemDto>> GetPagedAsync(
        RecipeQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var result = await _recipes.GetPagedAsync(
            page,
            pageSize,
            query.CategoryId,
            query.Difficulty,
            query.MaxCookTime,
            query.Sort,
            cancellationToken);

        return PagedResult<RecipeListItemDto>.Create(
            result.Items.Select(MapListItem).ToList(),
            result.TotalCount,
            page,
            pageSize);
    }

    public async Task<RecipeDetailDto?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var recipe = await _recipes.GetBySlugWithDetailsAsync(slug.Trim(), cancellationToken);
        return recipe is null ? null : MapDetail(recipe);
    }

    public async Task<RecipeDetailDto> CreateAsync(
        CreateRecipeRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);

        if (await _recipes.SlugExistsAsync(request.Slug.Trim(), cancellationToken))
            throw new ConflictException(ErrorCodes.RecipeSlugExists, "Slug đã tồn tại.");

        var recipe = Recipe.Create(
            request.Title.Trim(),
            request.Slug.Trim(),
            request.Description.Trim(),
            request.Instructions.Trim(),
            request.CategoryId,
            request.AuthorId.Trim(),
            request.PrepTime,
            request.CookTime,
            request.Servings,
            request.Difficulty,
            request.Status);

        foreach (var ingredient in request.Ingredients)
        {
            recipe.AddIngredient(
                ingredient.Name.Trim(),
                ingredient.Quantity,
                ingredient.Unit?.Trim(),
                ingredient.Notes?.Trim());
        }

        foreach (var step in request.Steps)
        {
            recipe.AddStep(step.Title.Trim(), step.Description.Trim(), step.TimerMinutes);
        }

        await _recipes.AddAsync(recipe, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapDetail(recipe);
    }

    public async Task PublishAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var recipe = await _recipes.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe '{id}' không tồn tại.");

        recipe.Publish();
        _recipes.Update(recipe);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateRequest(CreateRecipeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) throw new ArgumentException("Title is required.");
        if (string.IsNullOrWhiteSpace(request.Slug)) throw new ArgumentException("Slug is required.");
        if (string.IsNullOrWhiteSpace(request.Description)) throw new ArgumentException("Description is required.");
        if (string.IsNullOrWhiteSpace(request.Instructions)) throw new ArgumentException("Instructions are required.");
        if (string.IsNullOrWhiteSpace(request.AuthorId)) throw new ArgumentException("AuthorId is required.");
        if (request.Servings <= 0) throw new ArgumentException("Servings must be greater than zero.");
        if (request.Ingredients.Count < 10)
            throw new ArgumentException("A recipe must have at least 10 ingredients.");
        if (request.Steps.Count < 5)
            throw new ArgumentException("A recipe must have at least 5 steps.");
    }

    private static RecipeListItemDto MapListItem(Recipe recipe) => new(
        recipe.Id,
        recipe.Title,
        recipe.Slug,
        recipe.CategoryId,
        recipe.AuthorId,
        recipe.PrepTime,
        recipe.CookTime,
        recipe.Servings,
        recipe.Difficulty,
        recipe.Status);

    private static RecipeDetailDto MapDetail(Recipe recipe) => new(
        recipe.Id,
        recipe.Title,
        recipe.Slug,
        recipe.Description,
        recipe.Instructions,
        recipe.PrepTime,
        recipe.CookTime,
        recipe.Servings,
        recipe.Difficulty,
        recipe.Status,
        recipe.PublishedAt,
        recipe.Category is null
            ? null
            : new RecipeCategoryDto(recipe.Category.Id, recipe.Category.Name, recipe.Category.Slug),
        recipe.Author is null
            ? null
            : new RecipeAuthorDto(recipe.Author.Id, recipe.Author.DisplayName, recipe.Author.AvatarUrl),
        recipe.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.OrderIndex)
            .Select(i => new RecipeImageDto(i.Id, i.OriginalUrl, i.AltText, i.IsPrimary, i.OrderIndex))
            .ToList(),
        new RecipeNutritionDto(
            recipe.Nutrition.Calories,
            recipe.Nutrition.Protein,
            recipe.Nutrition.Carbohydrates,
            recipe.Nutrition.Fat,
            recipe.Nutrition.Fiber,
            recipe.Nutrition.Sodium),
        recipe.Ingredients
            .OrderBy(i => i.OrderIndex)
            .Select(i => new RecipeIngredientDto(i.Id, i.Name, i.Quantity, i.Unit, i.Notes, i.OrderIndex))
            .ToList(),
        recipe.Steps
            .OrderBy(s => s.StepNumber)
            .Select(s => new RecipeStepDto(s.Id, s.StepNumber, s.Title, s.Description, s.TimerMinutes))
            .ToList());
}

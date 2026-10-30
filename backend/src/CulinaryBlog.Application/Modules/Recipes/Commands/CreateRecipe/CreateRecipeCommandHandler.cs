using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.CreateRecipe;

internal sealed class CreateRecipeCommandHandler
    : IRequestHandler<CreateRecipeCommand, RecipeDetailDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public CreateRecipeCommandHandler(
        IRecipeRepository recipes,
        ICategoryRepository categories,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization)
    {
        _recipes = recipes;
        _categories = categories;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
    }

    public async Task<RecipeDetailDto> Handle(
        CreateRecipeCommand command,
        CancellationToken ct)
    {
        var request = command.Request;
        RecipeUseCaseSupport.ValidateCreate(request);

        var authorId = _authorization.RequireUserId();
        if (await _categories.GetByIdAsync(request.CategoryId, ct) is null)
            throw new ValidationException("categoryId", "Category không hợp lệ.");

        var title = request.Title.Trim();
        var slug = SlugHelper.Generate(title);
        if (await _recipes.SlugExistsAsync(slug, ct))
            throw new ConflictException(ErrorCodes.RecipeSlugExists, $"Slug '{slug}' đã tồn tại.");

        var recipe = Recipe.Create(title, slug, request.Description.Trim(), request.Instructions?.Trim() ?? string.Empty,
            request.CategoryId, authorId, request.PrepTimeMinutes, request.CookTimeMinutes, request.Servings, request.Difficulty);

        if (request.Nutrition is not null)
            recipe.SetNutrition(RecipeUseCaseSupport.MapNutrition(request.Nutrition));
        foreach (var ingredient in request.Ingredients ?? [])
            recipe.AddIngredient(ingredient.Name.Trim(), ingredient.Quantity, RecipeValidation.NullIfBlank(ingredient.Unit),
                RecipeValidation.NullIfBlank(ingredient.Notes), ingredient.OrderIndex);
        foreach (var step in request.Steps ?? [])
            recipe.AddStep(RecipeValidation.NullIfBlank(step.Title), step.Description.Trim(), step.TimerMinutes,
                RecipeValidation.NullIfBlank(step.ImageUrl));

        await _recipes.AddAsync(recipe, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        var created = await _recipes.GetBySlugWithDetailsAsync(slug, ct) ?? recipe;
        return RecipeUseCaseSupport.MapDetail(created);
    }
}

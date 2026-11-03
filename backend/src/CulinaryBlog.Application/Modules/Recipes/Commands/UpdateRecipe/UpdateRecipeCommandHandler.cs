using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Categories;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipe;

internal sealed class UpdateRecipeCommandHandler
    : IRequestHandler<UpdateRecipeCommand, RecipeDetailDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly ICategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public UpdateRecipeCommandHandler(IRecipeRepository recipes, ICategoryRepository categories,
        IUnitOfWork unitOfWork, RecipeAuthorizationHandler authorization)
    {
        _recipes = recipes;
        _categories = categories;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
    }

    public async Task<RecipeDetailDto> Handle(UpdateRecipeCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var expectedVersion = RecipeUseCaseSupport.ValidateUpdate(request, command.RowVersion);
        var recipe = await _recipes.GetByIdWithDetailsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        if (!recipe.RowVersion.AsSpan().SequenceEqual(expectedVersion))
            throw new ConcurrencyConflictException(ErrorCodes.RecipeConcurrencyConflict,
                "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại và thử lại.");
        if (request.CategoryId != recipe.CategoryId && await _categories.GetByIdAsync(request.CategoryId, ct) is null)
            throw new ValidationException("categoryId", "Category không hợp lệ.");

        var title = request.Title.Trim();
        var slug = recipe.Slug;
        if (recipe.Status == RecipeStatus.Draft)
        {
            slug = SlugHelper.Generate(title);
            if (slug != recipe.Slug && await _recipes.SlugExistsAsync(slug, ct))
                throw new ConflictException(ErrorCodes.RecipeSlugExists, $"Slug '{slug}' đã tồn tại.");
        }

        recipe.Update(title, slug, request.Description.Trim(), request.Instructions?.Trim() ?? string.Empty,
            request.CategoryId, request.PrepTimeMinutes, request.CookTimeMinutes, request.Servings, request.Difficulty);
        if (request.Nutrition is not null)
            recipe.SetNutrition(RecipeUseCaseSupport.MapNutrition(request.Nutrition));
        await _unitOfWork.SaveChangesAsync(ct);
        var updated = await _recipes.GetByIdWithDetailsAsync(command.RecipeId, ct) ?? recipe;
        return RecipeUseCaseSupport.MapDetail(updated);
    }
}

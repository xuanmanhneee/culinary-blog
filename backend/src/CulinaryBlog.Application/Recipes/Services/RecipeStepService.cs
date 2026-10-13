using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Services;

public sealed class RecipeStepService : IRecipeStepService
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public RecipeStepService(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
    }

    public async Task<RecipeStepDto> AddAsync(
        Guid recipeId,
        CreateStepRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request.Title, request.Description, request.TimerMinutes, request.ImageUrl);

        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        var step = recipe.AddStep(
            RecipeValidation.NullIfBlank(request.Title),
            request.Description.Trim(),
            request.TimerMinutes,
            RecipeValidation.NullIfBlank(request.ImageUrl));
        _recipes.AddStep(step);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(step);
    }

    public async Task<RecipeStepDto> UpdateAsync(
        Guid recipeId,
        Guid stepId,
        UpdateStepRequest request,
        CancellationToken cancellationToken = default)
    {
        Validate(request.Title, request.Description, request.TimerMinutes, request.ImageUrl);

        var recipe = await GetRecipeAsync(recipeId, cancellationToken);
        var step = recipe.FindStep(stepId) ?? throw StepNotFound(stepId);

        // Title bỏ trống thì giữ title hiện tại (ví dụ "Bước 2" do hệ thống đặt).
        step.Update(
            RecipeValidation.NullIfBlank(request.Title) ?? step.Title,
            request.Description.Trim(),
            request.TimerMinutes,
            RecipeValidation.NullIfBlank(request.ImageUrl));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(step);
    }

    public async Task DeleteAsync(
        Guid recipeId,
        Guid stepId,
        CancellationToken cancellationToken = default)
    {
        var recipe = await GetRecipeAsync(recipeId, cancellationToken);

        if (!recipe.RemoveStep(stepId))
            throw StepNotFound(stepId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Load recipe rồi kiểm tra quyền: chỉ owner hoặc Admin được sửa (NFR-SEC-006).</summary>
    private async Task<Recipe> GetRecipeAsync(Guid recipeId, CancellationToken cancellationToken)
    {
        var recipe = await _recipes.GetByIdWithStepsAsync(recipeId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe '{recipeId}' không tồn tại.");

        _authorization.EnsureCanModify(recipe);
        return recipe;
    }

    private static NotFoundException StepNotFound(Guid stepId) =>
        new(ErrorCodes.StepNotFound, $"Step '{stepId}' không tồn tại.");

    private static void Validate(string? title, string? description, int? timerMinutes, string? imageUrl)
    {
        var errors = new Dictionary<string, string[]>();
        RecipeValidation.ValidateStep(errors, string.Empty, title, description, timerMinutes, imageUrl);

        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    private static RecipeStepDto Map(RecipeStep step) => new(
        step.Id,
        step.StepNumber,
        step.Title,
        step.Description,
        step.TimerMinutes,
        step.ImageUrl);
}

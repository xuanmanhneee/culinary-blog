using FluentValidation;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeImage;

public sealed class UpdateRecipeImageCommandValidator : AbstractValidator<UpdateRecipeImageCommand>
{
    public UpdateRecipeImageCommandValidator()
    {
        RuleFor(command => command.RecipeId).NotEmpty();
        RuleFor(command => command.ImageId).NotEmpty();
        RuleFor(command => command.Request.OrderIndex)
            .GreaterThanOrEqualTo(0)
            .When(command => command.Request.OrderIndex.HasValue)
            .WithMessage("orderIndex không được âm.");
        RuleFor(command => command.Request.AltText)
            .MaximumLength(300)
            .When(command => command.Request.AltText is not null)
            .WithMessage("altText tối đa 300 ký tự.");
    }
}

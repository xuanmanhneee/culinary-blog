using FluentValidation;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public class SearchRecipesQueryValidator : AbstractValidator<SearchRecipesQuery>
{
    public SearchRecipesQueryValidator()
    {
        RuleFor(v => v.SearchTerm)
            .NotEmpty().WithMessage("SearchTerm is required.")
            .MinimumLength(2).WithMessage("SearchTerm must be at least 2 characters long.");
            
        RuleFor(v => v.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page at least greater than or equal to 1.");

        RuleFor(v => v.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("PageSize at least greater than or equal to 1.");
    }
}


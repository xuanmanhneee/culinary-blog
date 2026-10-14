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
        RuleFor(v => v.Page)
            .Must((query, page) => (long)(page - 1) * query.PageSize <= int.MaxValue)
            .WithMessage("The requested page is out of range.");

        RuleFor(v => v.PageSize)
            .InclusiveBetween(1, 50).WithMessage("PageSize must be between 1 and 50.");
    }
}

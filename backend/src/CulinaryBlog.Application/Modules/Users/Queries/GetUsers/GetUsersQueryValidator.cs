using CulinaryBlog.Domain.Modules.Identity;
using FluentValidation;

namespace CulinaryBlog.Application.Users.Queries.GetUsers;

public sealed class GetUsersQueryValidator : AbstractValidator<GetUsersQuery>
{
    public GetUsersQueryValidator()
    {
        RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 50);
        RuleFor(query => query.Search).MaximumLength(100);
        RuleFor(query => query.Role)
            .Must(role => string.IsNullOrWhiteSpace(role) ||
                          Roles.All.Contains(role, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Role must be one of: {string.Join(", ", Roles.All)}.");
    }
}

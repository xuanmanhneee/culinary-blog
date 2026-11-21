using CulinaryBlog.Application.Users.Queries.GetUsers;
using CulinaryBlog.Domain.Modules.Identity;

namespace CulinaryBlog.Tests.Users;

public sealed class GetUsersQueryValidatorTests
{
    [Theory]
    [InlineData(Roles.Admin, true)]
    [InlineData(Roles.Author, true)]
    [InlineData("Reader", false)]
    public void RoleFilter_AcceptsOnlySupportedRoles(string role, bool isValid)
    {
        var result = new GetUsersQueryValidator().Validate(new GetUsersQuery(Role: role));

        Assert.Equal(isValid, result.IsValid);
    }
}

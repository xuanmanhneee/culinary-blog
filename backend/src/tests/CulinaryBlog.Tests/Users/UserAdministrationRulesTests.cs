using CulinaryBlog.Domain.Modules.Identity;

namespace CulinaryBlog.Tests.Users;

public sealed class UserAdministrationRulesTests
{
    [Theory]
    [InlineData("admin-1", "admin-1", true, 2, true, false)]
    [InlineData("admin-1", "admin-2", true, 1, true, false)]
    [InlineData("admin-1", "admin-2", true, 2, true, true)]
    [InlineData("author-1", "admin-1", false, 1, true, true)]
    [InlineData("admin-1", "admin-1", true, 1, false, true)]
    public void CanRemoveAccess_enforces_self_and_last_admin_guards(
        string targetId,
        string administratorId,
        bool targetIsAdmin,
        int administratorCount,
        bool removesAccess,
        bool expected)
    {
        Assert.Equal(expected, UserAdministrationRules.CanRemoveAccess(
            targetId, administratorId, targetIsAdmin, administratorCount, removesAccess));
    }
}

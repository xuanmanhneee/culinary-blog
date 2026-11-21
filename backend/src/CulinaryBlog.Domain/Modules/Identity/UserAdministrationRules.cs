namespace CulinaryBlog.Domain.Modules.Identity;

public static class UserAdministrationRules
{
    public static bool CanRemoveAccess(
        string targetId,
        string? administratorId,
        bool targetIsAdmin,
        int administratorCount,
        bool removesAccess) =>
        !removesAccess ||
        !string.Equals(targetId, administratorId, StringComparison.Ordinal) &&
        (!targetIsAdmin || administratorCount > 1);
}

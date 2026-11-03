namespace CulinaryBlog.Application.Common.Interfaces;

public interface IWelcomeEmailScheduler
{
    void Schedule(string email, string fullName, string userId, string confirmationToken);
}

public interface IFileDeletionScheduler
{
    void Schedule(string url);
}

public interface IThumbnailScheduler
{
    void Schedule(Guid recipeId, Guid imageId, string originalUrl);
}

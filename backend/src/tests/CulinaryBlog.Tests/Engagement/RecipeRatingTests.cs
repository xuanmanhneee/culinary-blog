using CulinaryBlog.Engagement;

namespace CulinaryBlog.Tests.Engagement;

public sealed class RecipeRatingTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    [InlineData(5)]
    public void ScoreFromOneToFiveIsValid(int score) => Assert.True(RecipeRating.IsValidScore(score));

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void ScoreOutsideOneToFiveIsInvalid(int score) => Assert.False(RecipeRating.IsValidScore(score));
}

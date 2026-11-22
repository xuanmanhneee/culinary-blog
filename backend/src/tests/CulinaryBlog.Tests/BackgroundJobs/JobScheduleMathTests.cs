using CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

namespace CulinaryBlog.Tests.BackgroundJobs;

public sealed class JobScheduleMathTests
{
    [Fact]
    public void BuildCron_Weekly_UsesDayHourMinute() =>
        Assert.Equal("30 9 * * 1", JobScheduleMath.BuildCron(true, DayOfWeek.Monday, 9, 30));

    [Fact]
    public void BuildCron_Daily_IgnoresDayOfWeek() =>
        Assert.Equal("0 9 * * *", JobScheduleMath.BuildCron(false, DayOfWeek.Friday, 9, 0));

    [Fact]
    public void ParseCron_VietnamJob_KeepsValues()
    {
        var parsed = JobScheduleMath.ParseCron("0 7 * * 1", TimeSpan.FromHours(7));

        Assert.Equal(new JobScheduleMath.ParsedSchedule(DayOfWeek.Monday, 7, 0), parsed);
    }

    [Fact]
    public void ParseCron_UtcJob_ShiftsToVietnamTime()
    {
        // Lịch cũ "thứ hai 00:00 UTC" chính là 07:00 giờ Việt Nam.
        var parsed = JobScheduleMath.ParseCron("0 0 * * 1", TimeSpan.Zero);

        Assert.Equal(new JobScheduleMath.ParsedSchedule(DayOfWeek.Monday, 7, 0), parsed);
    }

    [Fact]
    public void ParseCron_UtcLateEvening_RollsOverToNextVietnameseDay()
    {
        // Chủ nhật 20:30 UTC = thứ hai 03:30 giờ Việt Nam.
        var parsed = JobScheduleMath.ParseCron("30 20 * * 0", TimeSpan.Zero);

        Assert.Equal(new JobScheduleMath.ParsedSchedule(DayOfWeek.Monday, 3, 30), parsed);
    }

    [Fact]
    public void ParseCron_DailyJob_HasNoDayOfWeek()
    {
        var parsed = JobScheduleMath.ParseCron("0 2 * * *", TimeSpan.Zero);

        Assert.Equal(new JobScheduleMath.ParsedSchedule(null, 9, 0), parsed);
    }

    [Theory]
    [InlineData("*/5 * * * *")]
    [InlineData("0 7 1 * *")]
    [InlineData("0 7 * * 1,3")]
    [InlineData("not a cron")]
    [InlineData("0 25 * * *")]
    public void ParseCron_UnsupportedExpressions_ReturnNull(string cron) =>
        Assert.Null(JobScheduleMath.ParseCron(cron, TimeSpan.Zero));

    [Fact]
    public void FromVietnamLocal_TreatsInputAsUtcPlusSeven()
    {
        var at = JobScheduleMath.FromVietnamLocal(new DateTime(2026, 11, 23, 9, 0, 0));

        Assert.Equal(new DateTimeOffset(2026, 11, 23, 2, 0, 0, TimeSpan.Zero), at);
    }

    [Fact]
    public void ToVietnam_ConvertsUtcToPlusSeven()
    {
        var local = JobScheduleMath.ToVietnam(new DateTime(2026, 11, 22, 20, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTimeOffset(2026, 11, 23, 3, 0, 0, TimeSpan.FromHours(7)), local);
    }

    [Fact]
    public void VietnamZone_ResolvesOnThisSystem() =>
        Assert.Equal(TimeSpan.FromHours(7), JobScheduleMath.Vietnam.BaseUtcOffset);

    [Fact]
    public void Catalog_ContainsNewsletterAndSitemapWithUniqueIds()
    {
        var ids = JobCatalog.All.Select(job => job.Id).ToList();

        Assert.Contains(JobCatalog.NewsletterId, ids);
        Assert.Contains(JobCatalog.SitemapId, ids);
        Assert.Equal(ids.Count, ids.Distinct().Count());
    }
}

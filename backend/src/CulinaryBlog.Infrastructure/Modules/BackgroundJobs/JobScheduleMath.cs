using Hangfire;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs;

/// <summary>Quy đổi giờ Việt Nam (UTC+7, không có giờ mùa hè) và cron cho trang quản lý tác vụ.</summary>
public static class JobScheduleMath
{
    public static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

    private static readonly Lazy<TimeZoneInfo> VietnamZone = new(() =>
    {
        foreach (var id in new[] { "Asia/Ho_Chi_Minh", "SE Asia Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        throw new InvalidOperationException("Không tìm thấy múi giờ Việt Nam trên hệ thống (cần tzdata).");
    });

    /// <summary>Múi giờ Việt Nam theo id hệ thống, để Hangfire lưu và đọc lại được.</summary>
    public static TimeZoneInfo Vietnam => VietnamZone.Value;

    public static DateTimeOffset ToVietnam(DateTime utc) =>
        new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToOffset(VietnamOffset);

    /// <summary>Chuyển giờ tường thuật Việt Nam (không kèm múi giờ) sang thời điểm tuyệt đối.</summary>
    public static DateTimeOffset FromVietnamLocal(DateTime local) =>
        new(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), VietnamOffset);

    public static string BuildCron(bool weekly, DayOfWeek dayOfWeek, int hour, int minute) =>
        weekly ? Cron.Weekly(dayOfWeek, hour, minute) : Cron.Daily(hour, minute);

    /// <summary>
    /// Đọc lại cron dạng "phút giờ * * thứ|*" đã lưu và quy về giờ Việt Nam.
    /// Trả null nếu cron là dạng tùy biến mà giao diện không biểu diễn được.
    /// </summary>
    public static ParsedSchedule? ParseCron(string cron, TimeSpan jobUtcOffset)
    {
        var parts = cron.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 5 || parts[2] != "*" || parts[3] != "*") return null;
        if (!int.TryParse(parts[0], out var minute) || !int.TryParse(parts[1], out var hour)) return null;
        if (minute is < 0 or > 59 || hour is < 0 or > 23) return null;

        int? day = null;
        if (parts[4] != "*")
        {
            if (!int.TryParse(parts[4], out var parsedDay) || parsedDay is < 0 or > 7) return null;
            day = parsedDay % 7;
        }

        var shift = (int)(VietnamOffset - jobUtcOffset).TotalMinutes;
        var total = hour * 60 + minute + shift;
        var dayShift = (int)Math.Floor(total / 1440.0);
        total -= dayShift * 1440;

        DayOfWeek? vnDay = day is null ? null : (DayOfWeek)(((day.Value + dayShift) % 7 + 7) % 7);
        return new ParsedSchedule(vnDay, total / 60, total % 60);
    }

    public sealed record ParsedSchedule(DayOfWeek? DayOfWeek, int Hour, int Minute);
}

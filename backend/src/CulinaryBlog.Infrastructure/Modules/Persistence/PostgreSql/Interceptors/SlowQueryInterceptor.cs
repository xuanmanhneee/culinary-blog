using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Interceptors;

/// <summary>
/// NFR-PERF: cảnh báo mọi câu lệnh SQL chạy lâu hơn ngưỡng (mặc định 100 ms).
/// Chỉ ghi nội dung câu lệnh đã tham số hóa, không ghi giá trị tham số để tránh lộ dữ liệu nhạy cảm.
/// </summary>
public sealed class SlowQueryInterceptor : DbCommandInterceptor
{
    public const int DefaultThresholdMs = 100;
    private const int MaxCommandLength = 500;

    private readonly ILogger<SlowQueryInterceptor> _logger;
    private readonly TimeSpan _threshold;

    public SlowQueryInterceptor(ILogger<SlowQueryInterceptor> logger, int thresholdMs = DefaultThresholdMs)
    {
        _logger = logger;
        _threshold = TimeSpan.FromMilliseconds(thresholdMs);
    }

    public override ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command, CommandExecutedEventData eventData, DbDataReader result, CancellationToken cancellationToken = default)
    {
        Report(command, eventData);
        return base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override DbDataReader ReaderExecuted(DbCommand command, CommandExecutedEventData eventData, DbDataReader result)
    {
        Report(command, eventData);
        return base.ReaderExecuted(command, eventData, result);
    }

    public override ValueTask<int> NonQueryExecutedAsync(
        DbCommand command, CommandExecutedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        Report(command, eventData);
        return base.NonQueryExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override ValueTask<object?> ScalarExecutedAsync(
        DbCommand command, CommandExecutedEventData eventData, object? result, CancellationToken cancellationToken = default)
    {
        Report(command, eventData);
        return base.ScalarExecutedAsync(command, eventData, result, cancellationToken);
    }

    private void Report(DbCommand command, CommandExecutedEventData eventData)
    {
        if (eventData.Duration < _threshold) return;

        var text = command.CommandText.ReplaceLineEndings(" ");
        if (text.Length > MaxCommandLength) text = text[..MaxCommandLength] + "…";

        _logger.LogWarning(
            "Slow query ({ElapsedMs} ms, threshold {ThresholdMs} ms): {CommandText}",
            (long)eventData.Duration.TotalMilliseconds, (long)_threshold.TotalMilliseconds, text);
    }
}

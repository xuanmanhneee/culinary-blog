using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace CulinaryBlog.Application.Common.Behaviors;

internal static class RecipeTelemetry
{
    internal const string MeterName = "CulinaryBlog.Recipes";
    private static readonly Meter Meter = new(MeterName);
    private static readonly Counter<long> Operations = Meter.CreateCounter<long>("recipe.operations");
    private static readonly Histogram<double> Duration =
        Meter.CreateHistogram<double>("recipe.operation.duration", "ms");

    internal static void Record(string action, string result, double elapsedMilliseconds, string? errorCode = null)
    {
        TagList tags = new()
        {
            { "recipe.action", action },
            { "result", result }
        };
        if (errorCode is not null) tags.Add("error.code", errorCode);

        Operations.Add(1, tags);
        Duration.Record(elapsedMilliseconds, tags);
    }
}

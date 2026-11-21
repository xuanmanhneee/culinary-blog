namespace CulinaryBlog.API.Endpoints;

public static class EngagementProxyEndpoints
{
    private static readonly string[] Methods = ["GET", "PUT", "DELETE"];
    private static readonly HashSet<string> HopByHopHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization",
        "TE", "Trailer", "Transfer-Encoding", "Upgrade"
    };

    public static IEndpointRouteBuilder MapEngagementProxyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapMethods("/api/v1/saved-recipes/{**path}", Methods, ForwardAsync);
        app.MapMethods("/api/v1/ratings/{**path}", Methods, ForwardAsync);
        return app;
    }

    private static async Task ForwardAsync(HttpContext context, IHttpClientFactory clients)
    {
        using var request = new HttpRequestMessage(
            new HttpMethod(context.Request.Method),
            $"{context.Request.Path}{context.Request.QueryString}");

        if (context.Request.ContentLength is > 0 || context.Request.Headers.TransferEncoding.Count > 0)
            request.Content = new StreamContent(context.Request.Body);

        foreach (var header in context.Request.Headers)
        {
            if (header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) || HopByHopHeaders.Contains(header.Key)) continue;
            if (!request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
                request.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }

        try
        {
            using var response = await clients.CreateClient("engagement").SendAsync(
                request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);

            context.Response.StatusCode = (int)response.StatusCode;
            foreach (var header in response.Headers)
                if (!HopByHopHeaders.Contains(header.Key)) context.Response.Headers[header.Key] = header.Value.ToArray();
            foreach (var header in response.Content.Headers)
                if (!HopByHopHeaders.Contains(header.Key)) context.Response.Headers[header.Key] = header.Value.ToArray();

            await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
        }
        catch (TaskCanceledException) when (!context.RequestAborted.IsCancellationRequested)
        {
            await Results.Problem(
                statusCode: StatusCodes.Status504GatewayTimeout,
                title: "Engagement service timed out.").ExecuteAsync(context);
        }
        catch (HttpRequestException)
        {
            await Results.Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Engagement service is unavailable.").ExecuteAsync(context);
        }
    }
}

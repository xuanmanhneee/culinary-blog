namespace CulinaryBlog.API.Extensions;

/// <summary>
/// Khai báo các response lỗi lặp lại cho tài liệu OpenAPI. Mọi lỗi đều là RFC 7807
/// (application/problem+json) do GlobalExceptionMiddleware hoặc UseStatusCodePages trả về.
/// </summary>
public static class OpenApiEndpointExtensions
{
    /// <summary>401 khi thiếu/sai access token, 403 khi thiếu role hoặc không phải owner/Admin.</summary>
    public static TBuilder ProducesAuthProblems<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

    public static TBuilder ProducesNotFoundProblem<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder.ProducesProblem(StatusCodes.Status404NotFound);
}

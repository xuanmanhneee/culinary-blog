using System.Text.Json;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace CulinaryBlog.API.Middleware;

/// <summary>
/// Bắt mọi exception chưa được xử lý trong pipeline và trả về RFC 7807 (application/problem+json).
/// Endpoint/service chỉ cần throw, không tự try/catch. Trường "type" chứa Application Error Code
/// (SRS Phụ lục B) để frontend xử lý theo mã.
/// </summary>
public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context, IProblemDetailsService problemDetailsService)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client đã ngắt kết nối, không còn ai để nhận response.
            _logger.LogDebug("Request {Method} {Path} was cancelled by the client.",
                context.Request.Method, context.Request.Path);
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogError(exception, "Unhandled exception after the response has started.");
                throw;
            }

            var problem = CreateProblemDetails(exception);
            var status = problem.Status!.Value;
            Log(exception, status);

            // Không gọi Response.Clear(): giữ lại header đã set (CORS, correlation id...).
            context.Response.StatusCode = status;

            var written = await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = problem,
                Exception = exception
            });

            if (!written)
            {
                await context.Response.WriteAsJsonAsync(
                    problem, problem.GetType(), options: null, contentType: "application/problem+json");
            }
        }
    }

    private ProblemDetails CreateProblemDetails(Exception exception) => exception switch
    {
        ValidationException ex => new HttpValidationProblemDetails(ex.Errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred.",
            Type = ex.ErrorCode,
            Detail = ex.Message
        },
        UnauthorizedException ex => Problem(StatusCodes.Status401Unauthorized, "Unauthorized.", ex.ErrorCode, ex.Message),
        ForbiddenException ex => Problem(StatusCodes.Status403Forbidden, "Forbidden.", ex.ErrorCode, ex.Message),
        NotFoundException ex => Problem(StatusCodes.Status404NotFound, "Resource not found.", ex.ErrorCode, ex.Message),
        ConflictException ex => Problem(StatusCodes.Status409Conflict, "Conflict.", ex.ErrorCode, ex.Message),
        ConcurrencyConflictException ex => Problem(StatusCodes.Status422UnprocessableEntity, "Concurrency conflict.", ex.ErrorCode, ex.Message),

        // Nhánh cụ thể phải đứng trước nhánh DomainException chung.
        BusinessRuleViolationException ex => Problem(StatusCodes.Status400BadRequest, "Business rule violation.", ex.ErrorCode, ex.Message),
        DomainException ex => Problem(StatusCodes.Status400BadRequest, "Business rule violation.", ex.ErrorCode, ex.Message),

        BadHttpRequestException ex => Problem(ex.StatusCode, "Bad request.", null, ex.Message),

        // Không lộ chi tiết lỗi hệ thống ra ngoài môi trường Development.
        _ => Problem(
            StatusCodes.Status500InternalServerError,
            "An unexpected error occurred.",
            null,
            _environment.IsDevelopment() ? exception.Message : null)
    };

    private static ProblemDetails Problem(int status, string title, string? errorCode, string? detail) => new()
    {
        Status = status,
        Title = title,
        Type = errorCode,
        Detail = detail
    };

    private void Log(Exception exception, int statusCode)
    {
        if (statusCode >= StatusCodes.Status500InternalServerError)
            _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        else
            _logger.LogInformation("Request failed with {StatusCode}: {Message}", statusCode, exception.Message);
    }
}
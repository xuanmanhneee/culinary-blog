using CulinaryBlog.API.Middleware;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Common.Exceptions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace CulinaryBlog.Tests.Middleware;

public sealed class GlobalExceptionMiddlewareTests
{
    [Theory]
    [MemberData(nameof(StatusCases))]
    public async Task InvokeAsync_MapsExpectedStatus(Exception exception, int expectedStatus)
    {
        var http = new DefaultHttpContext();
        var problems = new CapturingProblemDetailsService();
        var middleware = new GlobalExceptionMiddleware(
            _ => Task.FromException(exception),
            NullLogger<GlobalExceptionMiddleware>.Instance,
            new TestEnvironment());

        await middleware.InvokeAsync(http, problems);

        Assert.Equal(expectedStatus, http.Response.StatusCode);
        Assert.Equal(expectedStatus, problems.Problem?.Status);
        if (exception is ValidationException)
            Assert.Contains("email", Assert.IsType<HttpValidationProblemDetails>(problems.Problem).Errors.Keys);
    }

    public static TheoryData<Exception, int> StatusCases => new()
    {
        { new ValidationException("email", "Email không hợp lệ."), StatusCodes.Status422UnprocessableEntity },
        { new ConcurrencyConflictException(ErrorCodes.RecipeConcurrencyConflict, "Row version cũ."), StatusCodes.Status409Conflict }
    };

    private sealed class CapturingProblemDetailsService : IProblemDetailsService
    {
        public ProblemDetails? Problem { get; private set; }

        public ValueTask WriteAsync(ProblemDetailsContext context)
        {
            Problem = context.ProblemDetails;
            return ValueTask.CompletedTask;
        }
    }

    private sealed class TestEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = nameof(CulinaryBlog.Tests);
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}

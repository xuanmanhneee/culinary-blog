using System.Reflection;
using CulinaryBlog.Application.Common.Behaviors;
using CulinaryBlog.Application.Recipes.Services;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            // Audit đứng trước (bọc ngoài) Validation để ghi cả thao tác Recipe bị từ chối.
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(RecipeAuditBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        return services;
    }

    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<RecipeAuthorizationHandler>();

        return services;
    }
}

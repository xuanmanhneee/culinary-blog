using CulinaryBlog.Application.Categories.Services;
using CulinaryBlog.Application.Recipes.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IRecipeService, RecipeService>();
        services.AddScoped<IRecipeIngredientService, RecipeIngredientService>();
        services.AddScoped<IRecipeStepService, RecipeStepService>();
        services.AddScoped<IRecipeImageService, RecipeImageService>();
        return services;
    }
}

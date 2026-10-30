using Amazon.S3;
using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Modules.FileStorage;

internal static class DependencyInjection
{
    internal static IServiceCollection AddFileStorage(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        if (string.Equals(
                configuration["Storage:Provider"],
                "Local",
                StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            return services;
        }

        services.Configure<MinioOptions>(configuration.GetSection("Minio"));
        services.AddSingleton<IAmazonS3>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<MinioOptions>>().Value;
            return new AmazonS3Client(options.AccessKey, options.SecretKey, new AmazonS3Config
            {
                ServiceURL = options.Endpoint,
                ForcePathStyle = true,
                UseHttp = !options.UseHttps
            });
        });
        services.AddScoped<IFileStorageService, MinioFileStorageService>();
        return services;
    }

}

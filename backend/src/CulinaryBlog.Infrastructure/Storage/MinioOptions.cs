namespace CulinaryBlog.Infrastructure.Storage;

public sealed class MinioOptions
{
    public string Endpoint { get; set; } = "http://localhost:9000";
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string PublicEndpoint { get; set; } = string.Empty;
    public string BucketName { get; set; } = "culinary-blog";
    public bool UseHttps { get; set; }
}

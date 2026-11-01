using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Application.Common.Interfaces;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    Task SetAsync<T>(
        string key,
        T value,
        TimeSpan absoluteExpiration,
        string tag,
        CancellationToken cancellationToken = default);

    Task EvictByTagAsync(string tag, CancellationToken cancellationToken = default);
}

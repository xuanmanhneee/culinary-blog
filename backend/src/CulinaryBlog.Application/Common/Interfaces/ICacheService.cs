using System.Threading;
using System.Threading.Tasks;

namespace CulinaryBlog.Application.Common.Interfaces;

public interface ICacheService
{
    Task EvictByTagAsync(string tag, CancellationToken cancellationToken = default);
}

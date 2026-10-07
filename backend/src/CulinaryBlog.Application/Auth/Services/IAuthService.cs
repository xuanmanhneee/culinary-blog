using CulinaryBlog.Application.Auth.Models;

namespace CulinaryBlog.Application.Auth.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken ct = default);

    Task<AuthResponseDto> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken ct = default);

    Task<AuthResponseDto> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken ct = default);

    Task LogoutAsync(string userId, string refreshToken, CancellationToken ct = default);

    Task<UserProfileDto> GetProfileAsync(string userId, CancellationToken ct = default);

    Task<UserProfileDto> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken ct = default);
}
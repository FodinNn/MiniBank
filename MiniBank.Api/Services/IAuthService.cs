using MiniBank.Api.DTOs.Auth;

namespace MiniBank.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<AuthResponse?> UpdateProfileAsync(int userId, UpdateProfileRequest request);
}
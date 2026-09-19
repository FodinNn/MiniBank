using MiniBank.Api.DTOs.Auth;

namespace MiniBank.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
}
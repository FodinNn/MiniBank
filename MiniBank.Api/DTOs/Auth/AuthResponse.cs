namespace MiniBank.Api.DTOs.Auth;

public record AuthResponse(string Token, string Email, string FullName);
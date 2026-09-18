namespace MiniBank.Api.DTOs.Auth;

public record RegisterRequest(string Email, string Password, string FullName);
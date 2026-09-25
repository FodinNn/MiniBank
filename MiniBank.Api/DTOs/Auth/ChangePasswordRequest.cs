namespace MiniBank.Api.DTOs.Auth;

public record ChangePasswordRequest(string OldPassword, string NewPassword);
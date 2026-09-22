namespace MiniBank.Api.Middleware;

public record ErrorResponse(string Error, string? StackTrace = null);
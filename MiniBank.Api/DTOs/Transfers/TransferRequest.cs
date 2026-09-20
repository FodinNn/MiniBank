namespace MiniBank.Api.DTOs.Transfers;

public record TransferRequest(int FromAccountId, int ToAccountId, decimal Amount, string? Description);
namespace MiniBank.Api.DTOs.Transfers;

public record TransferResponse(int TransactionId, decimal Amount, string Currency, DateTime CreatedAt);
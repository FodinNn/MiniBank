namespace MiniBank.Api.DTOs.Transactions;

public record TransactionResponse(
    int Id,
    int? FromAccountId,
    int? ToAccountId,
    decimal Amount,
    string Currency,
    string Description,
    DateTime CreatedAt
);
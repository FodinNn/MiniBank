namespace MiniBank.Api.DTOs.Transactions;

public record TransactionListResponse(
    List<TransactionResponse> Items,
    int Total,
    int Page,
    int PageSize);
namespace MiniBank.Api.DTOs.Transactions;

public record TransactionFilter(
    int Page = 1,
    int PageSize = 20,
    DateTime? From = null,
    DateTime? To = null,
    string? Currency = null,
    string? Type = null,
    decimal? MinAmount = null,
    decimal? MaxAmount = null);
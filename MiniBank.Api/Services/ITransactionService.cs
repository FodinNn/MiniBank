using MiniBank.Api.DTOs.Transactions;

namespace MiniBank.Api.Services;

public interface ITransactionService
{
    Task<TransactionListResponse> GetUserTransactionsAsync(int userId, TransactionFilter filter);
}
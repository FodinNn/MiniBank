using MiniBank.Api.DTOs.Transactions;

namespace MiniBank.Api.Services;

public interface ITransactionService
{
    Task<List<TransactionResponse>> GetUserTransactionsAsync(int userId);
}
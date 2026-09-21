using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Transactions;

namespace MiniBank.Api.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _db;
    
    public TransactionService(AppDbContext db) => _db = db;

    public async Task<List<TransactionResponse>> GetUserTransactionsAsync(int userId)
    {
        var accountIds = await _db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync();

        return await _db.Transactions
            .Where(t => (t.FromAccountId != null && accountIds.Contains(t.FromAccountId.Value))
                        || (t.ToAccountId != null && accountIds.Contains(t.ToAccountId.Value)))
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionResponse(
                t.Id,
                t.FromAccountId,
                t.ToAccountId,
                t.Amount,
                t.Currency,
                t.Description,
                t.CreatedAt))
            .ToListAsync();
    }
}
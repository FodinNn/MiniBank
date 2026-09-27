using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Transactions;

namespace MiniBank.Api.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _db;

    public TransactionService(AppDbContext db) => _db = db;

    public async Task<TransactionListResponse> GetUserTransactionsAsync(int userId, TransactionFilter filter)
    {
        var accountIds = await _db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync();

        var query = _db.Transactions
            .Where(t => (t.FromAccountId != null && accountIds.Contains(t.FromAccountId.Value))
                        || (t.ToAccountId != null && accountIds.Contains(t.ToAccountId.Value)));

        if (filter.From.HasValue)
            query = query.Where(t => t.CreatedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(t => t.CreatedAt <= filter.To.Value);

        if (!string.IsNullOrEmpty(filter.Currency))
            query = query.Where(t => t.Currency == filter.Currency);

        if (filter.MinAmount.HasValue)
            query = query.Where(t => t.Amount >= filter.MinAmount.Value);

        if (filter.MaxAmount.HasValue)
            query = query.Where(t => t.Amount <= filter.MaxAmount.Value);

        if (!string.IsNullOrEmpty(filter.Type) && filter.Type != "all")
        {
            if (filter.Type == "income")
            {
                query = query.Where(t =>
                    t.ToAccountId != null
                    && accountIds.Contains(t.ToAccountId.Value)
                    && (t.FromAccountId == null || !accountIds.Contains(t.FromAccountId.Value)));
            }
            else if (filter.Type == "expense")
            {
                query = query.Where(t =>
                    t.FromAccountId != null
                    && accountIds.Contains(t.FromAccountId.Value)
                    && (t.ToAccountId == null || !accountIds.Contains(t.ToAccountId.Value)));
            }
        }

        var total = await query.CountAsync();

        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 20 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionResponse(
                t.Id,
                t.FromAccountId,
                t.ToAccountId,
                t.Amount,
                t.Currency,
                t.Description,
                t.CreatedAt))
            .ToListAsync();

        return new TransactionListResponse(items, total, page, pageSize);
    }
}
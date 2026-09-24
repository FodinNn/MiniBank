using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Transfers;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class TransferService : ITransferService
{
    private readonly AppDbContext _db;
    private readonly ILogger<TransferService> _logger;

    public TransferService(AppDbContext db, ILogger<TransferService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<TransferResult> TransferAsync(int userId, TransferRequest request)
    {
        if (request.Amount <= 0)
        {
            _logger.LogWarning("Transfer failed: invalid amount {Amount}", request.Amount);
            return TransferResult.InvalidAmount;
        }

        if (request.FromAccountId == request.ToAccountId)
        {
            _logger.LogWarning("Transfer failed: same account {AccountId}", request.FromAccountId);
            return TransferResult.SameAccount;
        }

        await using var tx = await _db.Database.BeginTransactionAsync();

        var from = await _db.Accounts
            .FromSqlRaw("SELECT * FROM \"Accounts\" WHERE \"Id\" = {0} FOR UPDATE", request.FromAccountId)
            .FirstOrDefaultAsync();

        if (from is null || from.UserId != userId)
        {
            _logger.LogWarning("Transfer failed: from account {AccountId} not found or not owned by user {UserId}",
                request.FromAccountId, userId);
            return TransferResult.FromAccountNotFound;
        }

        var to = await _db.Accounts
            .FromSqlRaw("SELECT * FROM \"Accounts\" WHERE \"Id\" = {0} FOR UPDATE", request.ToAccountId)
            .FirstOrDefaultAsync();

        if (to is null)
        {
            _logger.LogWarning("Transfer failed: to account {AccountId} not found", request.ToAccountId);
            return TransferResult.ToAccountNotFound;
        }

        if (from.Currency != to.Currency)
        {
            _logger.LogWarning("Transfer failed: currency mismatch {From} vs {To}",
                from.Currency, to.Currency);
            return TransferResult.CurrencyMismatch;
        }

        if (from.Balance < request.Amount)
        {
            _logger.LogWarning("Transfer failed: insufficient funds on account {AccountId}, balance {Balance}, requested {Amount}",
                from.Id, from.Balance, request.Amount);
            return TransferResult.InsufficientFunds;
        }

        from.Balance -= request.Amount;
        to.Balance += request.Amount;

        var transaction = new Transaction
        {
            FromAccountId = from.Id,
            ToAccountId = to.Id,
            Amount = request.Amount,
            Currency = from.Currency,
            Description = request.Description ?? "",
            CreatedAt = DateTime.UtcNow,
        };

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        _logger.LogInformation("Transfer completed: {Amount} {Currency} from account {From} to account {To}",
            request.Amount, from.Currency, from.Id, to.Id);

        return TransferResult.Success;
    }
}
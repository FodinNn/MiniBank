using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Transfers;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class TransferService : ITransferService
{
    private readonly AppDbContext _db;

    public TransferService(AppDbContext db) => _db = db;

    public async Task<TransferResult> TransferAsync(int userId, TransferRequest request)
    {
        if (request.Amount <= 0)
            return TransferResult.InvalidAmount;

        if (request.FromAccountId == request.ToAccountId)
            return TransferResult.SameAccount;

        await using var tx = await _db.Database.BeginTransactionAsync();

        var from = await _db.Accounts
            .FromSqlRaw("SELECT * FROM \"Accounts\" WHERE \"Id\" = {0} FOR UPDATE", request.FromAccountId)
            .FirstOrDefaultAsync();

        if (from is null || from.UserId != userId)
            return TransferResult.FromAccountNotFound;

        var to = await _db.Accounts
            .FromSqlRaw("SELECT * FROM \"Accounts\" WHERE \"Id\" = {0} FOR UPDATE", request.ToAccountId)
            .FirstOrDefaultAsync();

        if (to is null)
            return TransferResult.ToAccountNotFound;

        if (from.Currency != to.Currency)
            return TransferResult.CurrencyMismatch;

        if (from.Balance < request.Amount)
            return TransferResult.InsufficientFunds;

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

        return TransferResult.Success;
    }
}
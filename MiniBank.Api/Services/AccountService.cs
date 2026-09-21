using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Accounts;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _db;

    public AccountService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<AccountResponse>> GetUserAccountsAsync(int userId)
    {
        var accounts = await _db.Accounts
            .Where(a => a.UserId == userId)
            .ToListAsync();

        return accounts
            .Select(a => new AccountResponse(
                a.Id,
                a.Number,
                a.Balance,
                a.Currency,
                a.CreatedAt))
            .ToList();
    }

    public async Task<AccountResponse?> GetAccountAsync(int userId, int accountId)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (account is null) return null;

        return new AccountResponse(
            account.Id,
            account.Number,
            account.Balance,
            account.Currency,
            account.CreatedAt);
    }

    public async Task<AccountResponse> CreateAccountAsync(int userId, CreateAccountRequest request)
    {
        var number = "40817" + Random.Shared.NextInt64(1_000_000_000_000, 9_999_999_999_999);

        var account = new Account
        {
            Number = number,
            Balance = 0,
            Currency = request.Currency,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return new AccountResponse(
            account.Id,
            account.Number,
            account.Balance,
            account.Currency,
            account.CreatedAt);
    }

    public async Task<AccountResponse?> DepositAsync(int userId, int accountId, decimal amount)
    {
        if (amount <= 0) return null;

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);
        if (account is null) return null;
        
        account.Balance += amount;
        await _db.SaveChangesAsync();
        
        return new AccountResponse(account.Id,  account.Number, account.Balance, account.Currency, account.CreatedAt);
    }
}
using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Accounts;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AccountService> _logger;

    public AccountService(AppDbContext db, ILogger<AccountService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<AccountResponse>> GetUserAccountsAsync(int userId)
    {
        return await _db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => new AccountResponse(
                a.Id, a.Number, a.Balance, a.Currency, a.CreatedAt))
            .ToListAsync();
    }

    public async Task<AccountResponse?> GetAccountAsync(int userId, int accountId)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (account is null)
        {
            _logger.LogWarning("Account {AccountId} not found or not owned by user {UserId}",
                accountId, userId);
            return null;
        }

        return new AccountResponse(
            account.Id, account.Number, account.Balance, account.Currency, account.CreatedAt);
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

        _logger.LogInformation("Account created: {Number} {Currency} for user {UserId}",
            account.Number, account.Currency, userId);

        return new AccountResponse(
            account.Id, account.Number, account.Balance, account.Currency, account.CreatedAt);
    }

    public async Task<AccountResponse?> DepositAsync(int userId, int accountId, decimal amount)
    {
        if (amount <= 0)
        {
            _logger.LogWarning("Deposit failed: invalid amount {Amount}", amount);
            return null;
        }

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (account is null)
        {
            _logger.LogWarning("Deposit failed: account {AccountId} not found or not owned by user {UserId}",
                accountId, userId);
            return null;
        }

        account.Balance += amount;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deposit completed: {Amount} to account {AccountId}, new balance {Balance}",
            amount, account.Id, account.Balance);

        return new AccountResponse(
            account.Id, account.Number, account.Balance, account.Currency, account.CreatedAt);
    }

    public async Task<bool> DeleteAccountAsync(int userId, int accountId)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);
        
        if (account is null)
        {
            _logger.LogWarning("Delete account failed: account {AccountId} not found or not owned by user {UserId}",
                accountId, userId);
            return false;
        }

        if (account.Balance != 0)
        {
            _logger.LogWarning("Delete account failed: account {AccountId} has non-zero balance {Balance}",
            accountId, account.Balance);
            return false;
        }
        
        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();
        
        _logger.LogInformation("Account deleted: {AccountId} for user {UserId}", accountId, userId);

        return true;
    }
}
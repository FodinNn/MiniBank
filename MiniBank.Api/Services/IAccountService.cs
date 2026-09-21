using MiniBank.Api.DTOs.Accounts;

public interface IAccountService
{
    Task<List<AccountResponse>> GetUserAccountsAsync(int userId);
    Task<AccountResponse?> GetAccountAsync(int userId, int accountId);
    Task<AccountResponse> CreateAccountAsync(int userId, CreateAccountRequest request);
    Task<AccountResponse?> DepositAsync(int userId, int accountId, decimal amount);
}
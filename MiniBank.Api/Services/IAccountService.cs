using MiniBank.Api.DTOs.Accounts;

public interface IAccountService
{
    Task<List<AccountResponse>> GetUserAccountsAsync(int userId);
    Task<AccountResponse?> GetAccountAsync(int userId, int accountId);
    Task<AccountResponse> CreateAccountAsync(int userId, CreateAccountRequest request);
}
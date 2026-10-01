using MiniBank.Api.DTOs.Budgets;

namespace MiniBank.Api.Services;

public interface IBudgetService
{
    Task<List<BudgetResponse>> GetUserBudgetsAsync(int userId);
    Task<BudgetResponse> CreateBudgetAsync(int userId, CreateBudgetRequest request);
    Task<BudgetResponse?> UpdateBudgetAsync(int userId, int budgetId, UpdateBudgetRequest request);
    Task<bool> DeleteBudgetAsync(int userId, int budgetId);
}
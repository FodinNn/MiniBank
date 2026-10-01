namespace MiniBank.Api.DTOs.Budgets;

public record BudgetResponse(
    int Id,
    string Category,
    decimal MonthlyLimit,
    decimal SpentThisMonth,
    decimal RemainingPercent,
    bool IsExceeded);
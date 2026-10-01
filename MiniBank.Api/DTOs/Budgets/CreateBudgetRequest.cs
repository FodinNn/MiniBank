namespace MiniBank.Api.DTOs.Budgets;

public record CreateBudgetRequest(string Category, decimal MonthlyLimit);
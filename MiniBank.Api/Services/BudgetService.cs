using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Budgets;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class BudgetService : IBudgetService
{
    private readonly AppDbContext _db;
    private readonly ILogger<BudgetService> _logger;

    public BudgetService(AppDbContext db, ILogger<BudgetService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<BudgetResponse>> GetUserBudgetsAsync(int userId)
    {
        var accountIds = await _db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);
        
        var budgets = await _db.Budgets
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.Category)
            .ToListAsync();

        var result = new List<BudgetResponse>();

        foreach (var budget in budgets)
        {
            var spent = await _db.Transactions
                .Where(t => t.FromAccountId != null
                            && accountIds.Contains(t.FromAccountId.Value)
                            && (t.ToAccountId == null || !accountIds.Contains(t.ToAccountId.Value))
                            && t.Category == budget.Category
                            && t.CreatedAt >= monthStart
                            && t.CreatedAt < monthEnd)
                .SumAsync(t => t.Amount);

            result.Add(MapToResponse(budget, spent));
        }

        return result;
    }

    public async Task<BudgetResponse> CreateBudgetAsync(int userId, CreateBudgetRequest request)
    {
        var exists = await _db.Budgets
            .AnyAsync(b => b.UserId == userId && b.Category == request.Category);

        if (exists)
        {
            _logger.LogWarning("Budget creation failed: category {Category} already has budget for user {UserId}",
                request.Category, userId);
            throw new InvalidOperationException($"Budget for category '{request.Category}' already exists");
        }

        var budget = new Budget
        {
            Category = request.Category,
            MonthlyLimit = request.MonthlyLimit,
            CreatedAt = DateTime.UtcNow,
            UserId = userId
        };

        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Budget created: {BudgetId} '{Category}' limit {Limit} for user {UserId}",
            budget.Id, budget.Category, budget.MonthlyLimit, userId);

        return MapToResponse(budget, 0);
    }

    public async Task<BudgetResponse?> UpdateBudgetAsync(int userId, int budgetId, UpdateBudgetRequest request)
    {
        var budget = await _db.Budgets
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId);

        if (budget is null)
        {
            _logger.LogWarning("Update budget failed: budget {BudgetId} not found or not owned by user {UserId}",
                budgetId, userId);
            return null;
        }

        budget.MonthlyLimit = request.MonthlyLimit;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Budget updated: {BudgetId} new limit {Limit}", budgetId, request.MonthlyLimit);

        // Пересчёт потраченного
        var accountIds = await _db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var spent = await _db.Transactions
            .Where(t => t.FromAccountId != null
                        && accountIds.Contains(t.FromAccountId.Value)
                        && (t.ToAccountId == null || !accountIds.Contains(t.ToAccountId.Value))
                        && t.Category == budget.Category
                        && t.CreatedAt >= monthStart
                        && t.CreatedAt < monthEnd)
            .SumAsync(t => t.Amount);

        return MapToResponse(budget, spent);
    }
    
    public async Task<bool> DeleteBudgetAsync(int userId, int budgetId)
    {
        var budget = await _db.Budgets
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId);

        if (budget is null)
        {
            _logger.LogWarning("Delete budget failed: budget {BudgetId} not found or not owned by user {UserId}",
                budgetId, userId);
            return false;
        }

        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Budget deleted: {BudgetId} for user {UserId}", budgetId, userId);

        return true;
    }
    
    private static BudgetResponse MapToResponse(Budget b, decimal spent)
    {
        var remainingPercent = b.MonthlyLimit > 0
            ? Math.Round((b.MonthlyLimit - spent) / b.MonthlyLimit * 100, 2)
            : 0;

        return new BudgetResponse(
            b.Id,
            b.Category,
            b.MonthlyLimit,
            spent,
            remainingPercent,
            spent > b.MonthlyLimit);
    }
}
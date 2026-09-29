using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Goals;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class GoalService : IGoalService
{
    private readonly AppDbContext _db;
    private readonly ILogger<GoalService> _logger;

    public GoalService(AppDbContext db, ILogger<GoalService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<GoalResponse>> GetUserGoalsAsync(int userId)
    {
        return await _db.Goals
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new GoalResponse(
                g.Id,
                g.Name,
                g.TargetAmount,
                g.CurrentAmount,
                g.TargetAmount > 0 ? Math.Round(g.CurrentAmount / g.TargetAmount * 100, 2) : 0,
                g.Deadline,
                g.CreatedAt,
                g.IsCompleted))
            .ToListAsync();
    }

    public async Task<GoalResponse?> GetGoalAsync(int userId, int goalId)
    {
        var goal = await _db.Goals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

        if (goal is null)
        {
            _logger.LogWarning("Get goal failed: goal {GoalId} not found or not owned by user {UserId}",
                goalId, userId);
            return null;
        }

        return MapToResponse(goal);
    }

    public async Task<GoalResponse> CreateGoalAsync(int userId, CreateGoalRequest request)
    {
        var goal = new Goal
        {
            Name = request.Name,
            TargetAmount = request.TargetAmount,
            CurrentAmount = 0,
            Deadline = DateTime.SpecifyKind(request.Deadline, DateTimeKind.Utc),
            CreatedAt = DateTime.UtcNow,
            IsCompleted = false,
            UserId = userId
        };

        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Goal created: {GoalId} '{Name}' for user {UserId}",
            goal.Id, goal.Name, userId);

        return MapToResponse(goal);
    }

    public async Task<GoalResponse?> AddToGoalAsync(int userId, int goalId, decimal amount)
    {
        if (amount <= 0)
        {
            _logger.LogWarning("Add to goal failed: invalid amount {Amount}", amount);
            return null;
        }

        var goal = await _db.Goals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

        if (goal is null)
        {
            _logger.LogWarning("Add to goal failed: goal {GoalId} not found or not owned by user {UserId}",
                goalId, userId);
            return null;
        }

        goal.CurrentAmount += amount;
        goal.IsCompleted = goal.CurrentAmount >= goal.TargetAmount;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Added {Amount} to goal {GoalId}, current {Current}, target {Target}, completed {IsCompleted}",
            amount, goal.Id, goal.CurrentAmount, goal.TargetAmount, goal.IsCompleted);

        return MapToResponse(goal);
    }

    public async Task<bool> DeleteGoalAsync(int userId, int goalId)
    {
        var goal = await _db.Goals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

        if (goal is null)
        {
            _logger.LogWarning("Delete goal failed: goal {GoalId} not found or not owned by user {UserId}",
                goalId, userId);
            return false;
        }

        _db.Goals.Remove(goal);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Goal deleted: {GoalId} for user {UserId}", goalId, userId);

        return true;
    }

    private static GoalResponse MapToResponse(Goal g)
    {
        var progress = g.TargetAmount > 0
            ? Math.Round(g.CurrentAmount / g.TargetAmount * 100, 2)
            : 0;

        return new GoalResponse(
            g.Id,
            g.Name,
            g.TargetAmount,
            g.CurrentAmount,
            progress,
            g.Deadline,
            g.CreatedAt,
            g.IsCompleted);
    }
}
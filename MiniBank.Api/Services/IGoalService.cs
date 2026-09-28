using MiniBank.Api.DTOs.Goals;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public interface IGoalService
{
    Task<List<GoalResponse>> GetUserGoalsAsync(int userId);
    Task<GoalResponse?> GetGoalAsync(int userId, int goalId);
    Task<GoalResponse> CreateGoalAsync(int userId, CreateGoalRequest request);
    Task<GoalResponse?> AddToGoalAsync(int userId, int goalId, decimal amount);
    Task<bool> DeleteGoalAsync(int userId, int goalId);
}
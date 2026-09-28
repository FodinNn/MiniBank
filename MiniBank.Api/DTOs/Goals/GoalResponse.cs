namespace MiniBank.Api.DTOs.Goals;

public record GoalResponse(
    int Id,
    string Name,
    decimal TargetAmount,
    decimal CurrentAmount,
    decimal ProgressPercent,
    DateTime Deadline,
    DateTime CreatedAt,
    bool IsCompleted);
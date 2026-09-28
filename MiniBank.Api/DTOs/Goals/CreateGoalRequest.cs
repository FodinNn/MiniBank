namespace MiniBank.Api.DTOs.Goals;

public record CreateGoalRequest(
    string Name,
    decimal TargetAmount,
    DateTime Deadline);
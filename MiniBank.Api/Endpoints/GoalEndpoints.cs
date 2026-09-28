using System.Security.Claims;
using MiniBank.Api.DTOs.Goals;
using MiniBank.Api.Extensions;
using MiniBank.Api.Services;

namespace MiniBank.Api.Endpoints;

public static class GoalEndpoints
{
    public static void MapGoalEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/goals")
            .WithTags("Goals")
            .RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, IGoalService svc) =>
        {
            var goals = await svc.GetUserGoalsAsync(user.GetUserId());
            return Results.Ok(goals);
        });

        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, IGoalService svc) =>
        {
            var goal = await svc.GetGoalAsync(user.GetUserId(), id);
            return goal is null ? Results.NotFound() : Results.Ok(goal);
        });

        group.MapPost("/", async (CreateGoalRequest request, ClaimsPrincipal user, IGoalService svc) =>
        {
            var goal = await svc.CreateGoalAsync(user.GetUserId(), request);
            return Results.Created($"/api/goals/{goal.Id}", goal);
        });

        group.MapPost("/{id:int}/add", async (
            int id,
            UpdateGoalAmountRequest request,
            ClaimsPrincipal user,
            IGoalService svc) =>
        {
            var goal = await svc.AddToGoalAsync(user.GetUserId(), id, request.Amount);
            return goal is null ? Results.NotFound() : Results.Ok(goal);
        });

        group.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, IGoalService svc) =>
        {
            var deleted = await svc.DeleteGoalAsync(user.GetUserId(), id);
            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }
}
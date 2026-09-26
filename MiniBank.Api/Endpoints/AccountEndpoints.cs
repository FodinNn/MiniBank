using System.Security.Claims;
using MiniBank.Api.DTOs.Accounts;
using MiniBank.Api.Extensions;

namespace MiniBank.Api.Endpoints;

public static class AccountEndpoints
{
    public static void MapAccountEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/accounts")
            .WithTags("Accounts")
            .RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, IAccountService svc) =>
        {
            var accounts = await svc.GetUserAccountsAsync(user.GetUserId());
            return Results.Ok(accounts);
        });

        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, IAccountService svc) =>
        {
            var account = await svc.GetAccountAsync(user.GetUserId(), id);
            return account is null ? Results.NotFound() : Results.Ok(account);
        });

        group.MapPost("/", async (CreateAccountRequest requst, ClaimsPrincipal user, IAccountService svc) =>
        {
            var account = await svc.CreateAccountAsync(user.GetUserId(), requst);
            return Results.Created($"/api/accounts/{account.Id}", account);
        });

        group.MapPost("/{id:int}/deposit",
            async (int id, DepositRequest request, ClaimsPrincipal user, IAccountService svc) =>
            {
                var account = await svc.DepositAsync(user.GetUserId(), id, request.Amount);
                return account is null ? Results.NotFound() : Results.Ok(account);
            });

        group.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, IAccountService svc) =>
        {
            var deleted = await svc.DeleteAccountAsync(user.GetUserId(), id);
            return deleted 
                ? Results.NoContent() 
                : Results.NotFound(new { error = "Cannot delete account (not found, not owned, or non-zero balance)"});
        });
    }
}
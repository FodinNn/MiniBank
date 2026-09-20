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
    }
}
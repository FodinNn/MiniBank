using System.Security.Claims;
using MiniBank.Api.Extensions;
using MiniBank.Api.Services;

namespace MiniBank.Api.Endpoints;

public static class TransactionEndpoints
{
    public static void MapTransactionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/transactions")
            .WithTags("transactions")
            .RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, ITransactionService svc) =>
        {
            var transaction = await svc.GetUserTransactionsAsync(user.GetUserId());
            return Results.Ok(transaction);
        });
    }
}
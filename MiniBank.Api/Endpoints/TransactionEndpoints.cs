using System.Security.Claims;
using MiniBank.Api.DTOs.Transactions;
using MiniBank.Api.Extensions;
using MiniBank.Api.Services;

namespace MiniBank.Api.Endpoints;

public static class TransactionEndpoints
{
    public static void MapTransactionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/transactions")
            .WithTags("Transactions")
            .RequireAuthorization();

        group.MapGet("/", async (
            int? page,
            int? pageSize,
            DateTime? from,
            DateTime? to,
            string? currency,
            string? type,
            decimal? minAmount,
            decimal? maxAmount,
            ClaimsPrincipal user,
            ITransactionService svc) =>
        {
            var filter = new TransactionFilter(
                Page: page ?? 1,
                PageSize: pageSize ?? 20,
                From: from,
                To: to,
                Currency: currency,
                Type: type,
                MinAmount: minAmount,
                MaxAmount: maxAmount);

            var result = await svc.GetUserTransactionsAsync(user.GetUserId(), filter);
            return Results.Ok(result);
        });
    }
}
using System.Security.Claims;
using MiniBank.Api.DTOs.Transfers;
using MiniBank.Api.Extensions;
using MiniBank.Api.Services;

namespace MiniBank.Api.Endpoints;

public static class TransferEndpoints
{
    public static void MapTransferEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/transfers")
            .WithTags("transfer")
            .RequireAuthorization();

        group.MapPost("/", async (TransferRequest request, ClaimsPrincipal user, ITransferService svc) =>
        {
            var result = await svc.TransferAsync(user.GetUserId(), request);

            return result switch
            {
                TransferResult.Success => Results.Ok(new { status = "ok" }),
                TransferResult.FromAccountNotFound => Results.NotFound("From account not found"),
                TransferResult.ToAccountNotFound => Results.NotFound("To account not found"),
                TransferResult.InsufficientFunds => Results.BadRequest("Insufficient funds"),
                TransferResult.SameAccount => Results.BadRequest("Cannot transfer to the same account"),
                TransferResult.InvalidAmount => Results.BadRequest("Invalid amount"),
                TransferResult.CurrencyMismatch => Results.BadRequest("Currency mismatch"),
                _ => Results.StatusCode(500)
            };
        });
    }
}
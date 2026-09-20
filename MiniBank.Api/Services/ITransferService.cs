using MiniBank.Api.DTOs.Transfers;

namespace MiniBank.Api.Services;

public interface ITransferService
{
    Task<TransferResult> TransferAsync(int userId, TransferRequest request);
}
namespace MiniBank.Api.Services;

public enum TransferResult
{
    Success,
    FromAccountNotFound,
    ToAccountNotFound,
    InsufficientFunds,
    SameAccount,
    InvalidAmount,
    CurrencyMismatch,
}
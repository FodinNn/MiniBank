namespace MiniBank.Api.DTOs.Accounts;

public record AccountResponse(int Id, string Number, decimal Balance, string Currency, DateTime CreatedAt);
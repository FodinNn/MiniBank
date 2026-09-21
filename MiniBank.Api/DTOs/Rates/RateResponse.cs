namespace MiniBank.Api.DTOs.Rates;

public record RateResponse(string From,  string To, decimal Rate);
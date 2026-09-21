using MiniBank.Api.DTOs.Rates;

namespace MiniBank.Api.Services;

public class RateService : IRateService
{
    private static readonly List<RateResponse> Rates = new()
    {
        new("USD", "RUB", 95.00m),
        new("EUR", "RUB", 103.00m),
        new("USD", "EUR", 0.92m),
        new("EUR", "USD", 1.08m),
        new("RUB", "USD", 1m / 95.00m),
        new("RUB", "EUR", 1m / 103.00m),
    };

    public List<RateResponse> GetRates() => Rates;
}
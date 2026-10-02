using MiniBank.Api.DTOs.Rates;

namespace MiniBank.Api.Services;

public class RateService : IRateService
{
    private static readonly List<RateResponse> Rates = new()
    {
        new("EUR", "RUB", 92.50m),
        new("USD", "RUB", 84.20m),
        new("RUB", "EUR", 0.0108m),
        new("RUB", "USD", 0.0119m),
    };

    public List<RateResponse> GetRates() => Rates;
}
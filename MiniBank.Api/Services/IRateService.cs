using MiniBank.Api.DTOs.Rates;

namespace MiniBank.Api.Services;

public interface IRateService
{
    List<RateResponse> GetRates();
}
using MiniBank.Api.Services;

namespace MiniBank.Api.Endpoints;

public static class RateEndpoints
{
    public static void MapRateEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/rate")
            .WithTags("rate");
        
        group.MapGet("/", (IRateService svc) => Results.Ok(svc.GetRates()));
    }
}
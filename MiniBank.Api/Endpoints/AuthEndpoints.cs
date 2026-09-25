using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using MiniBank.Api.DTOs.Auth;
using MiniBank.Api.Extensions;
using MiniBank.Api.Services;

namespace MiniBank.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest request, IAuthService authService) =>
        {
            var response = await authService.RegisterAsync(request);
            return response is null
                ? Results.Conflict("Email is already in use")
                : Results.Ok(response);
        });

        group.MapPost("/login", async (LoginRequest request, IAuthService authService) =>
        {
            var response = await authService.LoginAsync(request);
            return response is null
                ? Results.Unauthorized()
                : Results.Ok(response);
        });

        group.MapGet("/me", (ClaimsPrincipal user) =>
            {
                var userId = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                var email = user.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
                var fullName = user.FindFirst("fullName")?.Value;

                return Results.Ok(new { userId, email, fullName });
            })
            .RequireAuthorization();

        group.MapPost("/change-password", async (
            ChangePasswordRequest request,
            ClaimsPrincipal user,
            IAuthService authService) =>
        {
            var ok = await authService.ChangePasswordAsync(user.GetUserId(), request);
            return ok
                ? Results.Ok(new { message = "Password changed successfully" })
                : Results.BadRequest(new { message = "invalid old password" });
        });
    }
}
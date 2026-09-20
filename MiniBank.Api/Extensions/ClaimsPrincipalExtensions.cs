using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MiniBank.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return int.Parse(value!);
    }
}
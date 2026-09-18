using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
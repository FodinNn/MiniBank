using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Auth;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    
    public AuthService(AppDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }
    
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists) return null;
        
        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Email = request.Email,
            PasswordHash = hash,
            FullName = request.FullName,
            CreatedAt = DateTime.UtcNow,
        };
        
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        
        var token = _tokenService.GenerateToken(user);
        
        return new AuthResponse(token, user.Email,  user.FullName);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return null;
        
        var ok = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!ok) return null;
        
        var token = _tokenService.GenerateToken(user);
        
        return new AuthResponse(token, user.Email, user.FullName);
    }
}
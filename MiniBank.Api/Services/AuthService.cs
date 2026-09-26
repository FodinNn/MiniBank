using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Data;
using MiniBank.Api.DTOs.Auth;
using MiniBank.Api.Models;

namespace MiniBank.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, ITokenService tokenService, ILogger<AuthService> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
        {
            _logger.LogWarning("Registration failed: email {Email} already exists", request.Email);
            return null;
        }

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
        
        _logger.LogInformation("User registered: {Email}", request.Email);

        return new AuthResponse(token, user.Email, user.FullName);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null)
        {
            _logger.LogWarning("Login failed: user {Email} not found", request.Email);
            return null;
        }

        var ok = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!ok)
        {
            _logger.LogWarning("Login failed: invalid password for {Email}", request.Email);
            return null;
        }

        var token = _tokenService.GenerateToken(user);
        
        _logger.LogInformation("User logged in: {Email}", request.Email);

        return new AuthResponse(token, user.Email, user.FullName);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            _logger.LogWarning("Change password failed: user {UserId} not found", userId);
            return false;
        }

        var ok = BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash);
        if (!ok)
        {
            _logger.LogWarning("Change password failed: invalid old password for user {UserId}", userId);
            return false;
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Password changed for user {UserId}", userId);

        return true;
    }

    public async Task<AuthResponse?> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            _logger.LogWarning("Update profile failed: user {UserId} not found", userId);
            return null;
        }
        
        user.FullName = request.FullName;
        await _db.SaveChangesAsync();
        
        _logger.LogInformation("Profile updated: {UserId}", userId);
        
        var token = _tokenService.GenerateToken(user);
        
        return new AuthResponse(token, user.Email, user.FullName);
    }
}
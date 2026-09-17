namespace MiniBank.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string FullName { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    
    public List<Account> Accounts { get; set; } = new();
}
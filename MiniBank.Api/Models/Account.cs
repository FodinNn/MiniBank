namespace MiniBank.Api.Models;

public class Account
{
    public int Id { get; set; }
    public string Number { get; set; } = "";
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "RUB";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
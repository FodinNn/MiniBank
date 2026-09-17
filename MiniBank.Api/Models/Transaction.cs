namespace MiniBank.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public int? FromAccountId { get; set; }
    public int? ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; }  = DateTime.UtcNow;
}
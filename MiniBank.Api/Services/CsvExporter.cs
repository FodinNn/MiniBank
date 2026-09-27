using System.Text;
using MiniBank.Api.DTOs.Transactions;

namespace MiniBank.Api.Services;

public static class CsvExporter
{
    public static string Export(List<TransactionResponse> transactions)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Date,FromAccountId,ToAccountId,Amount,Currency,Description");

        foreach (var t in transactions)
        {
            sb.AppendLine($"{t.CreatedAt:O},{t.FromAccountId},{t.ToAccountId},{t.Amount},{t.Currency},{Escape(t.Description)}");
        }
        
        return sb.ToString();
    }

    private static string Escape(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(",") || value.Contains("") || value.Contains('\n'))
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        return value;
    }
}
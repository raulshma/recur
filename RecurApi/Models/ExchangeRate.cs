using System.ComponentModel.DataAnnotations;

namespace RecurApi.Models;

public class ExchangeRate
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(3)]
    public string FromCurrency { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(3)]
    public string ToCurrency { get; set; } = string.Empty;
    
    [Required]
    public decimal Rate { get; set; }
    
    public DateTime Timestamp { get; set; }
    public DateTime ExpiresAt { get; set; }
    
    [MaxLength(50)]
    public string Source { get; set; } = "exchangerate-api";
}
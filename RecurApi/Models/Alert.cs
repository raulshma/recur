using System.ComponentModel.DataAnnotations;

namespace RecurApi.Models;

public class Alert
{
    public int Id { get; set; }
    
    [Required]
    public AlertType Type { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    
    public AlertSeverity Severity { get; set; } = AlertSeverity.Info;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    
    // Foreign keys
    [Required]
    public string UserId { get; set; } = string.Empty;
    public int? SubscriptionId { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Subscription? Subscription { get; set; }
}

public enum AlertType
{
    TrialEnding = 1,
    BillingReminder = 2,
    PriceChange = 3,
    DuplicateDetected = 4,
    UnusedSubscription = 5,
    Recommendation = 6,
    System = 7
}

public enum AlertSeverity
{
    Info = 1,
    Warning = 2,
    Critical = 3
} 
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecurApi.Models;

public class SubscriptionHistory
{
    public int Id { get; set; }
    
    [Required]
    public int SubscriptionId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string EventType { get; set; } = string.Empty; // "created", "updated", "cancelled", "reactivated", "trial_ended"
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    // JSON column to store additional details
    [MaxLength(4000)]
    public string? Details { get; set; }
    
    // Previous and new values for tracking changes
    [MaxLength(4000)]
    public string? PreviousValues { get; set; }
    
    [MaxLength(4000)]
    public string? NewValues { get; set; }
    
    // Navigation properties
    public virtual Subscription Subscription { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}

public enum SubscriptionEventType
{
    Created,
    Updated,
    Cancelled,
    Reactivated,
    TrialEnded,
    Deleted
} 
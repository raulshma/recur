using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecurApi.Models;

public class Subscription
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Cost { get; set; }
    
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";
    
    [Required]
    public BillingCycle BillingCycle { get; set; }
    
    public DateTime NextBillingDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    public DateTime? CancellationDate { get; set; }
    
    [MaxLength(500)]
    public string? Website { get; set; }
    
    [MaxLength(200)]
    public string? ContactEmail { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsTrial { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Foreign keys
    [Required]
    public string UserId { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Category Category { get; set; } = null!;
    public virtual ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public virtual ICollection<SubscriptionHistory> History { get; set; } = new List<SubscriptionHistory>();
}

public enum BillingCycle
{
    Weekly = 1,
    Monthly = 2,
    Quarterly = 3,
    SemiAnnually = 4,
    Annually = 5,
    Biannually = 6
} 
using Microsoft.AspNetCore.Identity;

namespace RecurApi.Models;

public class User : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? TimeZone { get; set; } = "UTC";
    public string Currency { get; set; } = "USD";
    public decimal? BudgetLimit { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public virtual ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public virtual UserSettings? Settings { get; set; }
} 
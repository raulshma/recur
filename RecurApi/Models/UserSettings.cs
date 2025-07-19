using System.ComponentModel.DataAnnotations;

namespace RecurApi.Models;

public class UserSettings
{
    public int Id { get; set; }
    
    // Notification preferences
    public bool DiscordNotifications { get; set; } = false;
    public string? DiscordWebhookUrl { get; set; }
    public bool TrialEndingAlerts { get; set; } = true;
    public bool BillingReminders { get; set; } = true;
    public bool PriceChangeAlerts { get; set; } = true;
    public bool RecommendationAlerts { get; set; } = true;
    
    // Reminder timing (days before)
    public int TrialEndingReminderDays { get; set; } = 3;
    public int BillingReminderDays { get; set; } = 2;
    
    // Display preferences
    public string DefaultCurrency { get; set; } = "USD";
    public string DateFormat { get; set; } = "MM/dd/yyyy";
    public string TimeZone { get; set; } = "UTC";
    public string Theme { get; set; } = "light"; // light, dark, auto
    
    // Dashboard preferences
    public string? DashboardLayout { get; set; } // JSON string for widget layout
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Foreign key
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    // Navigation property
    public virtual User User { get; set; } = null!;
} 
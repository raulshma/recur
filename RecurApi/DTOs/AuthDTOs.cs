using System.ComponentModel.DataAnnotations;

namespace RecurApi.DTOs;

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    
    public bool RememberMe { get; set; } = false;
}

public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string? TimeZone { get; set; }
    
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";
}

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public DateTime? Expires { get; set; }
    public UserDto? User { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? TimeZone { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal? BudgetLimit { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
    
    [Required]
    [Compare(nameof(NewPassword))]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}

public class UpdateProfileDto
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string? TimeZone { get; set; }
    
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";
    
    [Range(0, 999999.99)]
    public decimal? BudgetLimit { get; set; }
}

public class UserSettingsDto
{
    public bool EmailNotifications { get; set; } = true;
    public bool TrialEndingAlerts { get; set; } = true;
    public bool BillingReminders { get; set; } = true;
    public bool PriceChangeAlerts { get; set; } = true;
    public bool RecommendationAlerts { get; set; } = true;
    public int TrialEndingReminderDays { get; set; } = 3;
    public int BillingReminderDays { get; set; } = 2;
    public string DefaultCurrency { get; set; } = "USD";
    public string DateFormat { get; set; } = "MM/dd/yyyy";
    public string TimeZone { get; set; } = "UTC";
    public string Theme { get; set; } = "light";
    public string? DashboardLayout { get; set; }
    public decimal? BudgetLimit { get; set; }
}

public class UpdateUserSettingsDto
{
    public bool EmailNotifications { get; set; } = true;
    public bool TrialEndingAlerts { get; set; } = true;
    public bool BillingReminders { get; set; } = true;
    public bool PriceChangeAlerts { get; set; } = true;
    public bool RecommendationAlerts { get; set; } = true;
    
    [Range(1, 30)]
    public int TrialEndingReminderDays { get; set; } = 3;
    
    [Range(1, 30)]
    public int BillingReminderDays { get; set; } = 2;
    
    [MaxLength(3)]
    public string DefaultCurrency { get; set; } = "USD";
    
    [MaxLength(20)]
    public string DateFormat { get; set; } = "MM/dd/yyyy";
    
    [MaxLength(50)]
    public string TimeZone { get; set; } = "UTC";
    
    [MaxLength(10)]
    public string Theme { get; set; } = "light";
    
    public string? DashboardLayout { get; set; }
    
    [Range(0, 999999.99)]
    public decimal? BudgetLimit { get; set; }
} 
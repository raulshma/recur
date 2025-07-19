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
    
    [Required]
    public string InviteToken { get; set; } = string.Empty;
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
    public List<string> Roles { get; set; } = new List<string>();
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
    public bool DiscordNotifications { get; set; } = false;
    public string? DiscordWebhookUrl { get; set; }
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
    public bool DiscordNotifications { get; set; } = false;
    
    public string? DiscordWebhookUrl { get; set; }
    
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

// Admin DTOs
public class CreateInviteDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = "User";
    
    public int ExpirationDays { get; set; } = 7;
}

public class InviteDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    public string? InvitedByName { get; set; }
    public string? AcceptedByName { get; set; }
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public List<string> Roles { get; set; } = new List<string>();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int SubscriptionCount { get; set; }
}

public class UpdateUserRoleDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = string.Empty;
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int PendingInvites { get; set; }
    public int TotalSubscriptions { get; set; }
    public List<AdminUserDto> RecentUsers { get; set; } = new List<AdminUserDto>();
    public List<InviteDto> RecentInvites { get; set; } = new List<InviteDto>();
} 
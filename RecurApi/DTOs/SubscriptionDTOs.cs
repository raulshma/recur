using System.ComponentModel.DataAnnotations;
using RecurApi.Models;

namespace RecurApi.DTOs;

public class CreateSubscriptionDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [Range(0.01, 999999.99)]
    public decimal Cost { get; set; }
    
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";
    
    [Required]
    public BillingCycle BillingCycle { get; set; }
    
    [Required]
    public DateTime NextBillingDate { get; set; }
    
    public DateTime? TrialEndDate { get; set; }
    
    [MaxLength(500)]
    public string? Website { get; set; }
    
    [MaxLength(200)]
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [Required]
    public int CategoryId { get; set; }
    
    public bool IsTrial { get; set; } = false;
}

public class UpdateSubscriptionDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [Range(0.01, 999999.99)]
    public decimal Cost { get; set; }
    
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";
    
    [Required]
    public BillingCycle BillingCycle { get; set; }
    
    [Required]
    public DateTime NextBillingDate { get; set; }
    
    public DateTime? TrialEndDate { get; set; }
    
    [MaxLength(500)]
    public string? Website { get; set; }
    
    [MaxLength(200)]
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [Required]
    public int CategoryId { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsTrial { get; set; } = false;
}

public class SubscriptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Cost { get; set; }
    public string Currency { get; set; } = string.Empty;
    public BillingCycle BillingCycle { get; set; }
    public string BillingCycleText { get; set; } = string.Empty;
    public DateTime NextBillingDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    public DateTime? CancellationDate { get; set; }
    public string? Website { get; set; }
    public string? ContactEmail { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public bool IsTrial { get; set; }
    public int DaysUntilNextBilling { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public CategoryDto Category { get; set; } = null!;
    
    // Currency conversion properties
    public decimal? ConvertedCost { get; set; }
    public string? ConvertedCurrency { get; set; }
    public decimal? ExchangeRate { get; set; }
    public DateTime? RateTimestamp { get; set; }
    public bool IsConverted { get; set; }
    public bool IsRateStale { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCategoryDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    public string Color { get; set; } = "#007bff";
}

public class UpdateCategoryDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(7)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code")]
    public string Color { get; set; } = "#007bff";
}

public class DashboardStatsDto
{
    public int TotalSubscriptions { get; set; }
    public int ActiveSubscriptions { get; set; }
    public decimal TotalMonthlyCost { get; set; }
    public decimal TotalAnnualCost { get; set; }
    public int UpcomingBills { get; set; }
    public int TrialEnding { get; set; }
    public int DaysUntilNextBilling { get; set; }
    
    // Currency-aware properties
    public string DisplayCurrency { get; set; } = string.Empty;
    public List<CurrencyBreakdown> CurrencyBreakdowns { get; set; } = new();
}

public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "renewal", "trial", "budget", "info"
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }
}

public class MonthlySpendingDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Currency { get; set; } = "USD";
}

public class CategorySpendingDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
}

public class UpcomingBillDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    
    // Currency conversion properties
    public decimal? ConvertedAmount { get; set; }
    public string? ConvertedCurrency { get; set; }
    public bool IsConverted { get; set; }
}

public class RecentActivityDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // "created", "updated", "cancelled"
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string CategoryColor { get; set; } = string.Empty;
    
    // Cost information for currency display
    public decimal Cost { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string BillingCycle { get; set; } = string.Empty;
    
    // Currency conversion properties
    public decimal? ConvertedCost { get; set; }
    public string? ConvertedCurrency { get; set; }
    public bool IsConverted { get; set; }
}

public class AnalyticsOverviewDto
{
    public decimal TotalSpent { get; set; }
    public decimal MonthlyAverage { get; set; }
    public int ActiveSubscriptions { get; set; }
    public decimal SavingsPotential { get; set; }
    public string TimeRange { get; set; } = string.Empty;
    public string DisplayCurrency { get; set; } = "USD";
}

public class YearlyComparisonDto
{
    public string Year { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Currency { get; set; } = "USD";
}

public class TopSubscriptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public decimal OriginalCost { get; set; }
    public string OriginalCurrency { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryColor { get; set; } = string.Empty;
    public string BillingCycle { get; set; } = string.Empty;
    public string Trend { get; set; } = string.Empty; // "up", "down", "stable"
    public string Currency { get; set; } = "USD";
}

public class InsightDto
{
    public string Type { get; set; } = string.Empty; // "warning", "info", "success"
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Savings { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
}

public class SpendingPatternsDto
{
    public int MostActiveDay { get; set; }
    public double AverageServiceLifeMonths { get; set; }
    public double CancellationRate { get; set; }
    public string PeakSpendingMonth { get; set; } = string.Empty;
}

public class CurrencyBreakdown
{
    public string Currency { get; set; } = string.Empty;
    public decimal OriginalAmount { get; set; }
    public decimal ConvertedAmount { get; set; }
    public int SubscriptionCount { get; set; }
}
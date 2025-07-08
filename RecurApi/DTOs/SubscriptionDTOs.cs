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
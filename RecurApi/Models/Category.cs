using System.ComponentModel.DataAnnotations;

namespace RecurApi.Models;

public class Category
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(7)]
    public string Color { get; set; } = "#007bff"; // Default blue color
    
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
} 
using System.ComponentModel.DataAnnotations;

namespace RecurApi.Models;

public class Invite
{
    public int Id { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Token { get; set; } = string.Empty;
    
    public string? InvitedByUserId { get; set; }
    public virtual User? InvitedBy { get; set; }
    
    public string Role { get; set; } = "User";
    
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
    public string? AcceptedByUserId { get; set; }
    public virtual User? AcceptedBy { get; set; }
} 
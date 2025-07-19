using System.ComponentModel.DataAnnotations;

namespace RecurApi.Models;

public class InviteRequest
{
    public int Id { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Message { get; set; }
    
    public InviteRequestStatus Status { get; set; } = InviteRequestStatus.Pending;
    
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    
    // Admin who reviewed the request
    public string? ReviewedByUserId { get; set; }
    public virtual User? ReviewedBy { get; set; }
    
    // Generated invite ID when approved
    public int? GeneratedInviteId { get; set; }
    public virtual Invite? GeneratedInvite { get; set; }
    
    [MaxLength(500)]
    public string? ReviewNotes { get; set; }
}

public enum InviteRequestStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
} 
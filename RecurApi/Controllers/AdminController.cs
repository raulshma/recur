using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly RecurDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager,
        RecurDbContext context,
        ILogger<AdminController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
    }

    // Dashboard stats
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetAdminStats()
    {
        var totalUsers = await _userManager.Users.CountAsync();
        var activeUsers = await _userManager.Users.CountAsync(u => u.LastLoginAt != null);
        var pendingInvites = await _context.Invites.CountAsync(i => !i.IsUsed && i.ExpiresAt > DateTime.UtcNow);
        var totalSubscriptions = await _context.Subscriptions.CountAsync();

        var recentUsers = await _userManager.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentInvites = await _context.Invites
            .Include(i => i.InvitedBy)
            .Include(i => i.AcceptedBy)
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .ToListAsync();

        var adminUsers = new List<AdminUserDto>();
        foreach (var user in recentUsers)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var subscriptionCount = await _context.Subscriptions.CountAsync(s => s.UserId == user.Id);
            
            adminUsers.Add(new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList(),
                IsActive = user.LastLoginAt != null,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                SubscriptionCount = subscriptionCount
            });
        }

        var inviteDtos = recentInvites.Select(i => new InviteDto
        {
            Id = i.Id,
            Email = i.Email,
            Token = i.Token,
            Role = i.Role,
            CreatedAt = i.CreatedAt,
            ExpiresAt = i.ExpiresAt,
            IsUsed = i.IsUsed,
            UsedAt = i.UsedAt,
            InvitedByName = i.InvitedBy != null ? $"{i.InvitedBy.FirstName} {i.InvitedBy.LastName}".Trim() : null,
            AcceptedByName = i.AcceptedBy != null ? $"{i.AcceptedBy.FirstName} {i.AcceptedBy.LastName}".Trim() : null
        }).ToList();

        return Ok(new AdminStatsDto
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            PendingInvites = pendingInvites,
            TotalSubscriptions = totalSubscriptions,
            RecentUsers = adminUsers,
            RecentInvites = inviteDtos
        });
    }

    // User management
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Email!.Contains(search) || 
                                   u.FirstName!.Contains(search) || 
                                   u.LastName!.Contains(search));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        var adminUsers = new List<AdminUserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            
            // Filter by role if specified
            if (!string.IsNullOrEmpty(role) && !roles.Contains(role))
                continue;

            var subscriptionCount = await _context.Subscriptions.CountAsync(s => s.UserId == user.Id);
            
            adminUsers.Add(new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList(),
                IsActive = user.LastLoginAt != null,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                SubscriptionCount = subscriptionCount
            });
        }

        return Ok(adminUsers);
    }

    [HttpPut("users/{userId}/role")]
    public async Task<ActionResult> UpdateUserRole(string userId, UpdateUserRoleDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        // Ensure role exists
        if (!await _roleManager.RoleExistsAsync(dto.Role))
        {
            return BadRequest($"Role '{dto.Role}' does not exist");
        }

        // Remove all existing roles
        var currentRoles = await _userManager.GetRolesAsync(user);
        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        
        if (!removeResult.Succeeded)
        {
            return BadRequest("Failed to remove existing roles");
        }

        // Add new role
        var addResult = await _userManager.AddToRoleAsync(user, dto.Role);
        if (!addResult.Succeeded)
        {
            return BadRequest("Failed to assign new role");
        }

        _logger.LogInformation("User {UserId} role updated to {Role} by admin {AdminId}", 
            userId, dto.Role, User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok();
    }

    [HttpDelete("users/{userId}")]
    public async Task<ActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        // Don't allow deleting the current admin
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == currentUserId)
        {
            return BadRequest("Cannot delete your own account");
        }

        // Delete related data first
        var subscriptions = await _context.Subscriptions.Where(s => s.UserId == userId).ToListAsync();
        _context.Subscriptions.RemoveRange(subscriptions);

        var alerts = await _context.Alerts.Where(a => a.UserId == userId).ToListAsync();
        _context.Alerts.RemoveRange(alerts);

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        if (settings != null)
        {
            _context.UserSettings.Remove(settings);
        }

        await _context.SaveChangesAsync();

        // Delete user account
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest("Failed to delete user");
        }

        _logger.LogInformation("User {UserId} deleted by admin {AdminId}", 
            userId, currentUserId);

        return Ok();
    }

    // Invite management
    [HttpPost("invites")]
    public async Task<ActionResult<InviteDto>> CreateInvite(CreateInviteDto dto)
    {
        // Check if user already exists
        if (await _userManager.FindByEmailAsync(dto.Email) != null)
        {
            return BadRequest("User with this email already exists");
        }

        // Check if there's already a pending invite for this email
        var existingInvite = await _context.Invites
            .FirstOrDefaultAsync(i => i.Email == dto.Email && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow);

        if (existingInvite != null)
        {
            return BadRequest("There's already a pending invitation for this email");
        }

        // Ensure role exists
        if (!await _roleManager.RoleExistsAsync(dto.Role))
        {
            return BadRequest($"Role '{dto.Role}' does not exist");
        }

        // Generate secure token
        var token = GenerateSecureToken();
        
        var invite = new Invite
        {
            Email = dto.Email,
            Token = token,
            Role = dto.Role,
            InvitedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(dto.ExpirationDays)
        };

        _context.Invites.Add(invite);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invite created for {Email} with role {Role} by admin {AdminId}", 
            dto.Email, dto.Role, invite.InvitedByUserId);

        var inviteDto = new InviteDto
        {
            Id = invite.Id,
            Email = invite.Email,
            Token = invite.Token,
            Role = invite.Role,
            CreatedAt = invite.CreatedAt,
            ExpiresAt = invite.ExpiresAt,
            IsUsed = invite.IsUsed,
            UsedAt = invite.UsedAt
        };

        return Ok(inviteDto);
    }

    [HttpGet("invites")]
    public async Task<ActionResult<IEnumerable<InviteDto>>> GetInvites(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] bool includeUsed = false)
    {
        var query = _context.Invites
            .Include(i => i.InvitedBy)
            .Include(i => i.AcceptedBy)
            .AsQueryable();

        if (!includeUsed)
        {
            query = query.Where(i => !i.IsUsed && i.ExpiresAt > DateTime.UtcNow);
        }

        var invites = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        var inviteDtos = invites.Select(i => new InviteDto
        {
            Id = i.Id,
            Email = i.Email,
            Token = i.Token,
            Role = i.Role,
            CreatedAt = i.CreatedAt,
            ExpiresAt = i.ExpiresAt,
            IsUsed = i.IsUsed,
            UsedAt = i.UsedAt,
            InvitedByName = i.InvitedBy != null ? $"{i.InvitedBy.FirstName} {i.InvitedBy.LastName}".Trim() : null,
            AcceptedByName = i.AcceptedBy != null ? $"{i.AcceptedBy.FirstName} {i.AcceptedBy.LastName}".Trim() : null
        }).ToList();

        return Ok(inviteDtos);
    }

    [HttpDelete("invites/{inviteId}")]
    public async Task<ActionResult> DeleteInvite(int inviteId)
    {
        var invite = await _context.Invites.FindAsync(inviteId);
        if (invite == null)
        {
            return NotFound("Invite not found");
        }

        if (invite.IsUsed)
        {
            return BadRequest("Cannot delete a used invitation");
        }

        _context.Invites.Remove(invite);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invite {InviteId} for {Email} deleted by admin {AdminId}", 
            inviteId, invite.Email, User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok();
    }

    [HttpPost("invites/{inviteId}/resend")]
    public async Task<ActionResult<InviteDto>> ResendInvite(int inviteId)
    {
        var invite = await _context.Invites.FindAsync(inviteId);
        if (invite == null)
        {
            return NotFound("Invite not found");
        }

        if (invite.IsUsed)
        {
            return BadRequest("Cannot resend a used invitation");
        }

        // Generate new token and extend expiry
        invite.Token = GenerateSecureToken();
        invite.ExpiresAt = DateTime.UtcNow.AddDays(7);
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invite {InviteId} for {Email} resent by admin {AdminId}", 
            inviteId, invite.Email, User.FindFirstValue(ClaimTypes.NameIdentifier));

        var inviteDto = new InviteDto
        {
            Id = invite.Id,
            Email = invite.Email,
            Token = invite.Token,
            Role = invite.Role,
            CreatedAt = invite.CreatedAt,
            ExpiresAt = invite.ExpiresAt,
            IsUsed = invite.IsUsed,
            UsedAt = invite.UsedAt
        };

        return Ok(inviteDto);
    }

    private static string GenerateSecureToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }
} 
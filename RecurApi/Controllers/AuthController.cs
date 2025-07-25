using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using RecurApi.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly RecurDbContext _context;
    private readonly IDiscordNotificationService _discordNotificationService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        RecurDbContext context,
        IDiscordNotificationService discordNotificationService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _discordNotificationService = discordNotificationService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto model)
    {
        // Validate the invite token
        var invite = await _context.Invites
            .FirstOrDefaultAsync(i => i.Token == model.InviteToken && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow);

        if (invite == null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Invalid or expired invitation token"
            });
        }

        if (invite.Email != model.Email)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Email address does not match the invitation"
            });
        }

        if (await _userManager.FindByEmailAsync(model.Email) != null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Email is already registered"
            });
        }

        var user = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            TimeZone = model.TimeZone ?? "UTC",
            Currency = model.Currency
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            // Assign role from invite
            if (!string.IsNullOrEmpty(invite.Role))
            {
                await _userManager.AddToRoleAsync(user, invite.Role);
            }

            // Mark invite as used
            invite.IsUsed = true;
            invite.UsedAt = DateTime.UtcNow;
            invite.AcceptedByUserId = user.Id;
            
            // Create default user settings
            var settings = new UserSettings
            {
                UserId = user.Id,
                DefaultCurrency = model.Currency,
                TimeZone = model.TimeZone ?? "UTC"
            };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();

            var token = await GenerateJwtToken(user);
            
            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful",
                Token = token.Token,
                Expires = token.Expires,
                User = await MapToUserDto(user)
            });
        }

        return BadRequest(new AuthResponseDto
        {
            Success = false,
            Message = string.Join(", ", result.Errors.Select(e => e.Description))
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "Invalid email or password"
            });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (result.Succeeded)
        {
            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var token = await GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token.Token,
                Expires = token.Expires,
                User = await MapToUserDto(user)
            });
        }

        return Unauthorized(new AuthResponseDto
        {
            Success = false,
            Message = "Invalid email or password"
        });
    }

    [HttpPost("request-invite")]
    public async Task<ActionResult<AuthResponseDto>> RequestInvite(CreateInviteRequestDto model)
    {
        // Check if user already exists
        if (await _userManager.FindByEmailAsync(model.Email) != null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "An account with this email already exists"
            });
        }

        // Check if there's already a pending invite for this email
        var existingInvite = await _context.Invites
            .FirstOrDefaultAsync(i => i.Email == model.Email && !i.IsUsed && i.ExpiresAt > DateTime.UtcNow);

        if (existingInvite != null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "There's already a pending invitation for this email"
            });
        }

        // Check if there's already a pending invite request for this email
        var existingRequest = await _context.InviteRequests
            .FirstOrDefaultAsync(ir => ir.Email == model.Email && ir.Status == InviteRequestStatus.Pending);

        if (existingRequest != null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "There's already a pending invitation request for this email"
            });
        }

        var inviteRequest = new InviteRequest
        {
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            Message = model.Message,
            Status = InviteRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.InviteRequests.Add(inviteRequest);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Invite request created for {Email} by {FirstName} {LastName}", 
            model.Email, model.FirstName, model.LastName);

        // TODO: Send notification to admins about new invite request
        // This could be implemented with Discord notifications or email alerts

        return Ok(new AuthResponseDto
        {
            Success = true,
            Message = "Your invitation request has been submitted and is pending review by an administrator"
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<AuthResponseDto>> ChangePassword(ChangePasswordDto model)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "User not found"
            });
        }

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (result.Succeeded)
        {
            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Password changed successfully"
            });
        }

        return BadRequest(new AuthResponseDto
        {
            Success = false,
            Message = string.Join(", ", result.Errors.Select(e => e.Description))
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(await MapToUserDto(user));
    }

    private async Task<(string Token, DateTime Expires)> GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new("firstName", user.FirstName ?? ""),
            new("lastName", user.LastName ?? "")
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var expirationMinutes = int.Parse(jwtSettings["ExpirationInMinutes"] ?? "60");
        var expires = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<AuthResponseDto>> UpdateProfile(UpdateProfileDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "User not found"
            });
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.TimeZone = dto.TimeZone;
        user.Currency = dto.Currency;
        user.BudgetLimit = dto.BudgetLimit;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", result.Errors.Select(e => e.Description))
            });
        }

        // Sync currency with user settings to keep them consistent
        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (settings != null && settings.DefaultCurrency != dto.Currency)
        {
            settings.DefaultCurrency = dto.Currency;
            settings.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new AuthResponseDto
        {
            Success = true,
            Message = "Profile updated successfully",
            User = await MapToUserDto(user)
        });
    }

    [HttpGet("settings")]
    [Authorize]
    public async Task<ActionResult<UserSettingsDto>> GetUserSettings()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (settings == null)
        {
            // Create default settings using user's current currency
            settings = new UserSettings
            {
                UserId = user.Id,
                DefaultCurrency = user.Currency,
                TimeZone = user.TimeZone ?? "UTC",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        else if (settings.DefaultCurrency != user.Currency)
        {
            // Sync currency if they're out of sync - user profile takes precedence
            settings.DefaultCurrency = user.Currency;
            settings.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(MapToUserSettingsDto(settings, user));
    }

    [HttpPut("settings")]
    [Authorize]
    public async Task<ActionResult<AuthResponseDto>> UpdateUserSettings(UpdateUserSettingsDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (settings == null)
        {
            settings = new UserSettings
            {
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserSettings.Add(settings);
        }

        // Validate Discord webhook URL if provided and Discord notifications are enabled
        if (dto.DiscordNotifications && !string.IsNullOrEmpty(dto.DiscordWebhookUrl))
        {
            if (!IsValidDiscordWebhookUrl(dto.DiscordWebhookUrl))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid Discord webhook URL format. Please provide a valid Discord webhook URL."
                });
            }
        }
        
        // Allow saving empty webhook URL when Discord notifications are disabled
        if (!dto.DiscordNotifications)
        {
            dto.DiscordWebhookUrl = null;
        }

        // Update settings
        settings.DiscordNotifications = dto.DiscordNotifications;
        settings.DiscordWebhookUrl = dto.DiscordWebhookUrl;
        settings.TrialEndingAlerts = dto.TrialEndingAlerts;
        settings.BillingReminders = dto.BillingReminders;
        settings.PriceChangeAlerts = dto.PriceChangeAlerts;
        settings.RecommendationAlerts = dto.RecommendationAlerts;
        settings.TrialEndingReminderDays = dto.TrialEndingReminderDays;
        settings.BillingReminderDays = dto.BillingReminderDays;
        settings.DefaultCurrency = dto.DefaultCurrency;
        settings.DateFormat = dto.DateFormat;
        settings.TimeZone = dto.TimeZone;
        settings.Theme = dto.Theme;
        settings.DashboardLayout = dto.DashboardLayout;
        settings.UpdatedAt = DateTime.UtcNow;

        // Sync currency and budget limit with user profile to keep them consistent
        if (user.Currency != dto.DefaultCurrency || user.BudgetLimit != dto.BudgetLimit)
        {
            user.Currency = dto.DefaultCurrency;
            user.BudgetLimit = dto.BudgetLimit;
            await _userManager.UpdateAsync(user);
        }

        await _context.SaveChangesAsync();

        return Ok(new AuthResponseDto
        {
            Success = true,
            Message = "Settings updated successfully",
            User = await MapToUserDto(user)
        });
    }

    [HttpDelete("account")]
    [Authorize]
    public async Task<ActionResult<AuthResponseDto>> DeleteAccount()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        // Delete related data first
        var subscriptions = await _context.Subscriptions.Where(s => s.UserId == user.Id).ToListAsync();
        _context.Subscriptions.RemoveRange(subscriptions);

        var alerts = await _context.Alerts.Where(a => a.UserId == user.Id).ToListAsync();
        _context.Alerts.RemoveRange(alerts);

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (settings != null)
        {
            _context.UserSettings.Remove(settings);
        }

        await _context.SaveChangesAsync();

        // Delete user account
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", result.Errors.Select(e => e.Description))
            });
        }

        return Ok(new AuthResponseDto
        {
            Success = true,
            Message = "Account deleted successfully"
        });
    }

    [HttpGet("export-data")]
    [Authorize]
    public async Task<ActionResult> ExportUserData()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == user.Id)
            .Include(s => s.Category)
            .ToListAsync();

        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == user.Id);

        var exportData = new
        {
            User = new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.TimeZone,
                user.Currency,
                user.BudgetLimit,
                user.CreatedAt
            },
            Subscriptions = subscriptions.Select(s => new
            {
                s.Id,
                s.Name,
                s.Description,
                s.Cost,
                s.Currency,
                s.BillingCycle,
                s.NextBillingDate,
                s.IsActive,
                s.IsTrial,
                s.TrialEndDate,
                s.CreatedAt,
                Category = s.Category.Name
            }),
            Settings = settings
        };

        var json = System.Text.Json.JsonSerializer.Serialize(exportData, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        var bytes = System.Text.Encoding.UTF8.GetBytes(json);
        return File(bytes, "application/json", $"recur-data-export-{DateTime.UtcNow:yyyy-MM-dd}.json");
    }

    private async Task<UserDto> MapToUserDto(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            TimeZone = user.TimeZone,
            Currency = user.Currency,
            BudgetLimit = user.BudgetLimit,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Roles = roles.ToList()
        };
    }

    private static UserSettingsDto MapToUserSettingsDto(UserSettings settings, User user)
    {
        return new UserSettingsDto
        {
            DiscordNotifications = settings.DiscordNotifications,
            DiscordWebhookUrl = settings.DiscordWebhookUrl,
            TrialEndingAlerts = settings.TrialEndingAlerts,
            BillingReminders = settings.BillingReminders,
            PriceChangeAlerts = settings.PriceChangeAlerts,
            RecommendationAlerts = settings.RecommendationAlerts,
            TrialEndingReminderDays = settings.TrialEndingReminderDays,
            BillingReminderDays = settings.BillingReminderDays,
            DefaultCurrency = settings.DefaultCurrency,
            DateFormat = settings.DateFormat,
            TimeZone = settings.TimeZone,
            Theme = settings.Theme,
            DashboardLayout = settings.DashboardLayout,
            BudgetLimit = user.BudgetLimit
        };
    }

    [HttpPost("test-discord")]
    [Authorize]
    public async Task<IActionResult> TestDiscordNotification([FromBody] TestDiscordRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            await _discordNotificationService.SendNotificationAsync(
                request.WebhookUrl, 
                "🧪 Test Notification", 
                "This is a test notification from Recur to verify your Discord webhook is working correctly!"
            );
            
            return Ok(new { success = true, message = "Test notification sent successfully!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test Discord notification");
            return BadRequest(new { success = false, message = "Failed to send test notification. Please check your webhook URL." });
        }
    }

    private static bool IsValidDiscordWebhookUrl(string url)
    {
        try
        {
            var uri = new Uri(url);
            
            // Check if it's a Discord webhook URL
            if (!uri.Host.Contains("discord.com") && !uri.Host.Contains("discordapp.com"))
            {
                return false;
            }

            // Check if it contains the webhook path
            if (!uri.AbsolutePath.Contains("/api/webhooks/"))
            {
                return false;
            }

            // Check if it has the required webhook ID and token parts
            var pathParts = uri.AbsolutePath.Split('/');
            var webhookIndex = Array.IndexOf(pathParts, "webhooks");
            
            if (webhookIndex == -1 || pathParts.Length < webhookIndex + 3)
            {
                return false;
            }

            var webhookId = pathParts[webhookIndex + 1];
            var webhookToken = pathParts[webhookIndex + 2];

            if (string.IsNullOrEmpty(webhookId) || string.IsNullOrEmpty(webhookToken))
            {
                return false;
            }

            // Basic format checks for ID and token
            if (!long.TryParse(webhookId, out _))
            {
                return false;
            }

            if (webhookToken.Length < 50) // More lenient token length check
            {
                return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class TestDiscordRequest
{
    public string WebhookUrl { get; set; } = string.Empty;
} 
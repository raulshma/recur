using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
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

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        RecurDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto model)
    {
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
                User = MapToUserDto(user)
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
                User = MapToUserDto(user)
            });
        }

        return Unauthorized(new AuthResponseDto
        {
            Success = false,
            Message = "Invalid email or password"
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

        return Ok(MapToUserDto(user));
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
            User = MapToUserDto(user)
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

        // Update settings
        settings.EmailNotifications = dto.EmailNotifications;
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
            User = MapToUserDto(user)
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

    private static UserDto MapToUserDto(User user)
    {
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
            LastLoginAt = user.LastLoginAt
        };
    }

    private static UserSettingsDto MapToUserSettingsDto(UserSettings settings, User user)
    {
        return new UserSettingsDto
        {
            EmailNotifications = settings.EmailNotifications,
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
} 
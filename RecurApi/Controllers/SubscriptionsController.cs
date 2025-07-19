using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using RecurApi.Services;
using System.Security.Claims;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly RecurDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ICurrencyConversionService _currencyService;

    public SubscriptionsController(RecurDbContext context, UserManager<User> userManager, ICurrencyConversionService currencyService)
    {
        _context = context;
        _userManager = userManager;
        _currencyService = currencyService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SubscriptionDto>>> GetSubscriptions(
        [FromQuery] int? categoryId,
        [FromQuery] bool? isActive,
        [FromQuery] bool? isTrial,
        [FromQuery] string? search,
        [FromQuery] string? convertToCurrency)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var query = _context.Subscriptions
            .Include(s => s.Category)
            .Where(s => s.UserId == userId);

        if (categoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == categoryId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (isTrial.HasValue)
        {
            query = query.Where(s => s.IsTrial == isTrial.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => s.Name.Contains(search) || 
                                   s.Description!.Contains(search));
        }

        var subscriptions = await query
            .OrderBy(s => s.Name)
            .ToListAsync();

        // Get user's preferred currency if not specified
        var targetCurrency = convertToCurrency;
        if (string.IsNullOrWhiteSpace(targetCurrency))
        {
            var user = await _userManager.FindByIdAsync(userId);
            targetCurrency = user?.Currency ?? "USD";
        }

        var subscriptionDtos = new List<SubscriptionDto>();
        
        foreach (var subscription in subscriptions)
        {
            var dto = await MapToSubscriptionDtoAsync(subscription, targetCurrency);
            subscriptionDtos.Add(dto);
        }

        return Ok(subscriptionDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SubscriptionDto>> GetSubscription(int id, [FromQuery] string? convertToCurrency)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        // Get user's preferred currency if not specified
        var targetCurrency = convertToCurrency;
        if (string.IsNullOrWhiteSpace(targetCurrency))
        {
            var user = await _userManager.FindByIdAsync(userId);
            targetCurrency = user?.Currency ?? "USD";
        }

        var dto = await MapToSubscriptionDtoAsync(subscription, targetCurrency);
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<SubscriptionDto>> CreateSubscription(CreateSubscriptionDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // Verify category exists
        var category = await _context.Categories.FindAsync(model.CategoryId);
        if (category == null)
        {
            return BadRequest("Invalid category");
        }

        var subscription = new Subscription
        {
            UserId = userId,
            Name = model.Name,
            Description = model.Description,
            Cost = model.Cost,
            Currency = model.Currency,
            BillingCycle = model.BillingCycle,
            NextBillingDate = model.NextBillingDate,
            TrialEndDate = model.TrialEndDate,
            Website = model.Website,
            ContactEmail = model.ContactEmail,
            Notes = model.Notes,
            CategoryId = model.CategoryId,
            IsTrial = model.IsTrial,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        // Load category for response
        await _context.Entry(subscription)
            .Reference(s => s.Category)
            .LoadAsync();

        var dto = await MapToSubscriptionDtoAsync(subscription, subscription.Currency);
        return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSubscription(int id, UpdateSubscriptionDto model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        // Verify category exists
        var category = await _context.Categories.FindAsync(model.CategoryId);
        if (category == null)
        {
            return BadRequest("Invalid category");
        }

        subscription.Name = model.Name;
        subscription.Description = model.Description;
        subscription.Cost = model.Cost;
        subscription.Currency = model.Currency;
        subscription.BillingCycle = model.BillingCycle;
        subscription.NextBillingDate = model.NextBillingDate;
        subscription.TrialEndDate = model.TrialEndDate;
        subscription.Website = model.Website;
        subscription.ContactEmail = model.ContactEmail;
        subscription.Notes = model.Notes;
        subscription.CategoryId = model.CategoryId;
        subscription.IsActive = model.IsActive;
        subscription.IsTrial = model.IsTrial;
        subscription.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSubscription(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        _context.Subscriptions.Remove(subscription);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelSubscription(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        subscription.IsActive = false;
        subscription.CancellationDate = DateTime.UtcNow;
        subscription.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/reactivate")]
    public async Task<IActionResult> ReactivateSubscription(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        subscription.IsActive = true;
        subscription.CancellationDate = null;
        subscription.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<SubscriptionHistoryDto>>> GetSubscriptionHistory(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        var history = new List<SubscriptionHistoryDto>();

        // Add creation event
        history.Add(new SubscriptionHistoryDto
        {
            Id = Guid.NewGuid().ToString(),
            Type = "created",
            Title = "Subscription Created",
            Description = $"Subscription for {subscription.Name} was created",
            Timestamp = subscription.CreatedAt,
            Details = new Dictionary<string, object>
            {
                ["cost"] = subscription.Cost,
                ["currency"] = subscription.Currency,
                ["billingCycle"] = GetBillingCycleText(subscription.BillingCycle),
                ["category"] = subscription.Category.Name
            }
        });

        // Add cancellation event if cancelled
        if (subscription.CancellationDate.HasValue)
        {
            history.Add(new SubscriptionHistoryDto
            {
                Id = Guid.NewGuid().ToString(),
                Type = "cancelled",
                Title = "Subscription Cancelled",
                Description = $"Subscription for {subscription.Name} was cancelled",
                Timestamp = subscription.CancellationDate.Value,
                Details = new Dictionary<string, object>
                {
                    ["reason"] = "User cancelled subscription"
                }
            });
        }

        // Add trial end event if trial ended
        if (subscription.IsTrial && subscription.TrialEndDate.HasValue && subscription.TrialEndDate.Value < DateTime.UtcNow)
        {
            history.Add(new SubscriptionHistoryDto
            {
                Id = Guid.NewGuid().ToString(),
                Type = "trial_ended",
                Title = "Trial Period Ended",
                Description = $"Trial period for {subscription.Name} has ended",
                Timestamp = subscription.TrialEndDate.Value,
                Details = new Dictionary<string, object>
                {
                    ["trialDuration"] = (subscription.TrialEndDate.Value - subscription.CreatedAt).Days + " days"
                }
            });
        }

        // If last updated differs from created, add update event
        if (subscription.UpdatedAt > subscription.CreatedAt.AddMinutes(1))
        {
            history.Add(new SubscriptionHistoryDto
            {
                Id = Guid.NewGuid().ToString(),
                Type = "updated",
                Title = "Subscription Updated",
                Description = $"Subscription details for {subscription.Name} were modified",
                Timestamp = subscription.UpdatedAt,
                Details = new Dictionary<string, object>
                {
                    ["cost"] = subscription.Cost,
                    ["currency"] = subscription.Currency,
                    ["billingCycle"] = GetBillingCycleText(subscription.BillingCycle)
                }
            });
        }

        // Sort by timestamp descending (most recent first)
        return Ok(history.OrderByDescending(h => h.Timestamp));
    }

    private static SubscriptionDto MapToSubscriptionDto(Subscription subscription)
    {
        return new SubscriptionDto
        {
            Id = subscription.Id,
            Name = subscription.Name,
            Description = subscription.Description,
            Cost = subscription.Cost,
            Currency = subscription.Currency,
            BillingCycle = subscription.BillingCycle,
            BillingCycleText = GetBillingCycleText(subscription.BillingCycle),
            NextBillingDate = subscription.NextBillingDate,
            TrialEndDate = subscription.TrialEndDate,
            CancellationDate = subscription.CancellationDate,
            Website = subscription.Website,
            ContactEmail = subscription.ContactEmail,
            Notes = subscription.Notes,
            IsActive = subscription.IsActive,
            IsTrial = subscription.IsTrial,
            DaysUntilNextBilling = (subscription.NextBillingDate.Date - DateTime.UtcNow.Date).Days,
            CreatedAt = subscription.CreatedAt,
            UpdatedAt = subscription.UpdatedAt,
            Category = new CategoryDto
            {
                Id = subscription.Category.Id,
                Name = subscription.Category.Name,
                Description = subscription.Category.Description,
                Color = subscription.Category.Color,
                IsDefault = subscription.Category.IsDefault,
                CreatedAt = subscription.Category.CreatedAt
            }
        };
    }

    private async Task<SubscriptionDto> MapToSubscriptionDtoAsync(Subscription subscription, string targetCurrency)
    {
        var dto = new SubscriptionDto
        {
            Id = subscription.Id,
            Name = subscription.Name,
            Description = subscription.Description,
            Cost = subscription.Cost,
            Currency = subscription.Currency,
            BillingCycle = subscription.BillingCycle,
            BillingCycleText = GetBillingCycleText(subscription.BillingCycle),
            NextBillingDate = subscription.NextBillingDate,
            TrialEndDate = subscription.TrialEndDate,
            CancellationDate = subscription.CancellationDate,
            Website = subscription.Website,
            ContactEmail = subscription.ContactEmail,
            Notes = subscription.Notes,
            IsActive = subscription.IsActive,
            IsTrial = subscription.IsTrial,
            DaysUntilNextBilling = (subscription.NextBillingDate.Date - DateTime.UtcNow.Date).Days,
            CreatedAt = subscription.CreatedAt,
            UpdatedAt = subscription.UpdatedAt,
            Category = new CategoryDto
            {
                Id = subscription.Category.Id,
                Name = subscription.Category.Name,
                Description = subscription.Category.Description,
                Color = subscription.Category.Color,
                IsDefault = subscription.Category.IsDefault,
                CreatedAt = subscription.Category.CreatedAt
            }
        };

        // Handle currency conversion if needed
        if (!string.IsNullOrWhiteSpace(targetCurrency) && 
            !string.Equals(subscription.Currency, targetCurrency, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var conversionResult = await _currencyService.ConvertWithMetadataAsync(
                    subscription.Cost, 
                    subscription.Currency, 
                    targetCurrency);

                dto.ConvertedCost = conversionResult.ConvertedAmount;
                dto.ConvertedCurrency = targetCurrency;
                dto.ExchangeRate = conversionResult.ExchangeRate;
                dto.RateTimestamp = conversionResult.RateTimestamp;
                dto.IsConverted = true;
                dto.IsRateStale = conversionResult.IsStale;
            }
            catch
            {
                // If conversion fails, keep original values and mark as not converted
                dto.IsConverted = false;
            }
        }
        else
        {
            // No conversion needed
            dto.IsConverted = false;
        }

        return dto;
    }

    private static string GetBillingCycleText(BillingCycle cycle)
    {
        return cycle switch
        {
            BillingCycle.Weekly => "Weekly",
            BillingCycle.Monthly => "Monthly",
            BillingCycle.Quarterly => "Quarterly",
            BillingCycle.SemiAnnually => "Semi-Annually",
            BillingCycle.Annually => "Annually",
            BillingCycle.Biannually => "Bi-Annually",
            _ => "Unknown"
        };
    }
} 
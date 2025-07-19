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
    private readonly ISubscriptionHistoryService _historyService;

    public SubscriptionsController(RecurDbContext context, UserManager<User> userManager, ICurrencyConversionService currencyService, ISubscriptionHistoryService historyService)
    {
        _context = context;
        _userManager = userManager;
        _currencyService = currencyService;
        _historyService = historyService;
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

        // Record creation event in history
        await _historyService.RecordEventAsync(
            subscription.Id,
            userId,
            SubscriptionEventType.Created,
            "Subscription Created",
            $"Subscription for {subscription.Name} was created",
            new
            {
                cost = subscription.Cost,
                currency = subscription.Currency,
                billingCycle = GetBillingCycleText(subscription.BillingCycle),
                category = category.Name
            });

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

        // Capture previous values for history
        var previousValues = new
        {
            Name = subscription.Name,
            Cost = subscription.Cost,
            Currency = subscription.Currency,
            BillingCycle = subscription.BillingCycle,
            IsActive = subscription.IsActive,
            IsTrial = subscription.IsTrial
        };

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

        // Record update event in history
        var newValues = new
        {
            Name = subscription.Name,
            Cost = subscription.Cost,
            Currency = subscription.Currency,
            BillingCycle = subscription.BillingCycle,
            IsActive = subscription.IsActive,
            IsTrial = subscription.IsTrial
        };

        await _historyService.RecordEventAsync(
            subscription.Id,
            userId,
            SubscriptionEventType.Updated,
            "Subscription Updated",
            $"Subscription details for {subscription.Name} were modified",
            new
            {
                cost = subscription.Cost,
                currency = subscription.Currency,
                billingCycle = GetBillingCycleText(subscription.BillingCycle),
                category = category.Name
            },
            previousValues,
            newValues);

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

        // Record deletion event in history before removing
        await _historyService.RecordEventAsync(
            subscription.Id,
            userId,
            SubscriptionEventType.Deleted,
            "Subscription Deleted",
            $"Subscription for {subscription.Name} was permanently deleted",
            new
            {
                cost = subscription.Cost,
                currency = subscription.Currency,
                wasActive = subscription.IsActive,
                deletionDate = DateTime.UtcNow
            });

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

        var cancellationDate = DateTime.UtcNow;
        subscription.IsActive = false;
        subscription.CancellationDate = cancellationDate;
        subscription.UpdatedAt = cancellationDate;

        await _context.SaveChangesAsync();

        // Record cancellation event in history
        await _historyService.RecordEventAsync(
            subscription.Id,
            userId,
            SubscriptionEventType.Cancelled,
            "Subscription Cancelled",
            $"Subscription for {subscription.Name} was cancelled",
            new
            {
                reason = "User cancelled subscription",
                cancellationDate = cancellationDate,
                cost = subscription.Cost,
                currency = subscription.Currency
            });

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

        var reactivationDate = DateTime.UtcNow;
        var previousCancellationDate = subscription.CancellationDate;
        
        subscription.IsActive = true;
        subscription.CancellationDate = null;
        subscription.UpdatedAt = reactivationDate;

        await _context.SaveChangesAsync();

        // Record reactivation event in history
        await _historyService.RecordEventAsync(
            subscription.Id,
            userId,
            SubscriptionEventType.Reactivated,
            "Subscription Reactivated",
            $"Subscription for {subscription.Name} was reactivated",
            new
            {
                reactivationDate = reactivationDate,
                previousCancellationDate = previousCancellationDate,
                cost = subscription.Cost,
                currency = subscription.Currency,
                daysCancelled = previousCancellationDate.HasValue 
                    ? (int)(reactivationDate - previousCancellationDate.Value).TotalDays 
                    : 0
            });

        return NoContent();
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<SubscriptionHistoryDto>>> GetSubscriptionHistory(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        // Get history from the database
        var historyEntries = await _historyService.GetHistoryAsync(id);
        
        // Convert to DTOs
        var historyDtos = historyEntries.Select(h => new SubscriptionHistoryDto
        {
            Id = h.Id.ToString(),
            Type = h.EventType,
            Title = h.Title,
            Description = h.Description,
            Timestamp = h.Timestamp,
            Details = !string.IsNullOrEmpty(h.Details) 
                ? System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(h.Details) ?? new Dictionary<string, object>()
                : new Dictionary<string, object>()
        });

        return Ok(historyDtos);
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
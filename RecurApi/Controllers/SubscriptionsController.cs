using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using System.Security.Claims;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly RecurDbContext _context;
    private readonly UserManager<User> _userManager;

    public SubscriptionsController(RecurDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SubscriptionDto>>> GetSubscriptions(
        [FromQuery] int? categoryId,
        [FromQuery] bool? isActive,
        [FromQuery] bool? isTrial,
        [FromQuery] string? search)
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
            .Select(s => MapToSubscriptionDto(s))
            .ToListAsync();

        return Ok(subscriptions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SubscriptionDto>> GetSubscription(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        var subscription = await _context.Subscriptions
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (subscription == null)
        {
            return NotFound();
        }

        return Ok(MapToSubscriptionDto(subscription));
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

        return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, MapToSubscriptionDto(subscription));
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
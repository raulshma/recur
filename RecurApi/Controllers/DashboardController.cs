using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.DTOs;
using System.Security.Claims;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly RecurDbContext _context;

    public DashboardController(RecurDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var activeSubscriptions = subscriptions.Where(s => s.IsActive).ToList();
        var currentDate = DateTime.UtcNow;

        // Calculate monthly cost (convert all to monthly equivalent)
        var totalMonthlyCost = activeSubscriptions.Sum(s => s.GetMonthlyCost());

        // Calculate annual cost
        var totalAnnualCost = totalMonthlyCost * 12;

        // Get upcoming bills (next 30 days)
        var upcomingBills = activeSubscriptions
            .Where(s => s.NextBillingDate <= currentDate.AddDays(30))
            .Count();

        // Get trials ending soon (next 7 days)
        var trialsEnding = activeSubscriptions
            .Where(s => s.IsTrial && s.TrialEndDate.HasValue && 
                       s.TrialEndDate.Value <= currentDate.AddDays(7))
            .Count();

        // Get next billing date
        var nextBilling = activeSubscriptions
            .Where(s => s.NextBillingDate > currentDate)
            .OrderBy(s => s.NextBillingDate)
            .FirstOrDefault();

        var daysUntilNextBilling = nextBilling != null 
            ? (int)(nextBilling.NextBillingDate - currentDate).TotalDays
            : 0;

        var stats = new DashboardStatsDto
        {
            TotalSubscriptions = subscriptions.Count,
            ActiveSubscriptions = activeSubscriptions.Count,
            TotalMonthlyCost = totalMonthlyCost,
            TotalAnnualCost = totalAnnualCost,
            UpcomingBills = upcomingBills,
            TrialEnding = trialsEnding,
            DaysUntilNextBilling = daysUntilNextBilling
        };

        return Ok(stats);
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var notifications = new List<NotificationDto>();
        var currentDate = DateTime.UtcNow;

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .Include(s => s.Category)
            .ToListAsync();

        // Renewal reminders (next 7 days)
        var upcomingRenewals = subscriptions
            .Where(s => s.NextBillingDate <= currentDate.AddDays(7) && s.NextBillingDate > currentDate)
            .Take(5)
            .ToList();

        foreach (var subscription in upcomingRenewals)
        {
            var daysUntil = (int)(subscription.NextBillingDate - currentDate).TotalDays;
            var timeText = daysUntil == 0 ? "today" : 
                          daysUntil == 1 ? "tomorrow" : 
                          $"in {daysUntil} days";

            notifications.Add(new NotificationDto
            {
                Id = Guid.NewGuid().ToString(),
                Type = "renewal",
                Title = $"{subscription.Name} renewal {timeText}",
                Message = $"${subscription.Cost:F2} will be charged",
                Timestamp = currentDate,
                IsRead = false
            });
        }

        // Trial ending reminders
        var endingTrials = subscriptions
            .Where(s => s.IsTrial && s.TrialEndDate.HasValue && 
                       s.TrialEndDate.Value <= currentDate.AddDays(7) &&
                       s.TrialEndDate.Value > currentDate)
            .Take(3)
            .ToList();

        foreach (var trial in endingTrials)
        {
            var daysUntil = (int)(trial.TrialEndDate!.Value - currentDate).TotalDays;
            var timeText = daysUntil == 0 ? "today" : 
                          daysUntil == 1 ? "tomorrow" : 
                          $"in {daysUntil} days";

            notifications.Add(new NotificationDto
            {
                Id = Guid.NewGuid().ToString(),
                Type = "trial",
                Title = $"{trial.Name} trial ending {timeText}",
                Message = "Decide whether to continue or cancel",
                Timestamp = currentDate,
                IsRead = false
            });
        }

        // Budget alerts (if user has budget settings)
        var user = await _context.Users.FindAsync(userId);
        if (user?.BudgetLimit > 0)
        {
            var monthlySpend = subscriptions.Sum(s => s.GetMonthlyCost());
            var budgetPercentage = (monthlySpend / (decimal)user.BudgetLimit) * 100;

            if (budgetPercentage >= 80)
            {
                notifications.Add(new NotificationDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Type = "budget",
                    Title = "Monthly budget alert",
                    Message = $"You've spent {budgetPercentage:F0}% of your budget",
                    Timestamp = currentDate,
                    IsRead = false
                });
            }
        }

        return Ok(notifications.OrderByDescending(n => n.Timestamp).Take(10));
    }
}

// Extension method for calculating monthly cost
public static class SubscriptionExtensions
{
    public static decimal GetMonthlyCost(this Models.Subscription subscription)
    {
        return subscription.BillingCycle switch
        {
            Models.BillingCycle.Weekly => subscription.Cost * 4.33m, // Average weeks per month
            Models.BillingCycle.Monthly => subscription.Cost,
            Models.BillingCycle.Quarterly => subscription.Cost / 3,
            Models.BillingCycle.SemiAnnually => subscription.Cost / 6,
            Models.BillingCycle.Annually => subscription.Cost / 12,
            Models.BillingCycle.Biannually => subscription.Cost / 24,
            _ => subscription.Cost
        };
    }
}
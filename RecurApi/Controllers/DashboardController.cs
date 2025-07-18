using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Services;
using System.Security.Claims;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly RecurDbContext _context;
    private readonly ICurrencyConversionService _currencyConversionService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(RecurDbContext context, ICurrencyConversionService currencyConversionService, ILogger<DashboardController> logger)
    {
        _context = context;
        _currencyConversionService = currencyConversionService;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats([FromQuery] string? displayCurrency = null)
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

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        // Group subscriptions by currency for breakdown
        var currencyGroups = activeSubscriptions
            .GroupBy(s => s.Currency)
            .ToList();

        var currencyBreakdowns = new List<CurrencyBreakdown>();
        decimal totalConvertedMonthlyCost = 0;

        // Warm cache for common currency pairs to improve performance
        await _currencyConversionService.WarmCacheForCommonCurrencyPairsAsync(targetCurrency);

        // Performance optimization: Enhanced batch currency conversion for dashboard loading
        var uniqueCurrencies = currencyGroups.Select(g => g.Key).Where(c => c != targetCurrency).ToHashSet();
        
        // Pre-warm cache for frequently used currency pairs to improve performance
        if (uniqueCurrencies.Any())
        {
            // Preload frequently used pairs for better performance
            var frequentPairs = uniqueCurrencies.Select(c => (c, targetCurrency)).ToList();
            await _currencyConversionService.PreloadCurrencyPairsAsync(frequentPairs);
        }
        
        // Performance optimization: Use enhanced batch conversion with optimizations
        Dictionary<string, decimal> conversionResults = new();
        if (uniqueCurrencies.Any())
        {
            try
            {
                // Create batch conversion requests for all currency groups
                var batchRequests = currencyGroups
                    .Where(g => g.Key != targetCurrency)
                    .Select(g => new BatchConversionRequest
                    {
                        Amount = g.Sum(s => s.GetMonthlyCost()),
                        FromCurrency = g.Key,
                        ToCurrency = targetCurrency
                    })
                    .ToList();

                if (batchRequests.Any())
                {
                    // Use optimized batch conversion for maximum performance
                    var batchResults = await _currencyConversionService.BatchConvertWithOptimizationAsync(batchRequests);
                    
                    // Map results back to currency groups
                    for (int i = 0; i < batchRequests.Count && i < batchResults.Count; i++)
                    {
                        var request = batchRequests[i];
                        var result = batchResults[i];
                        
                        if (!result.HasError)
                        {
                            conversionResults[request.FromCurrency] = result.ConvertedAmount;
                        }
                        else
                        {
                            // Log error but continue with fallback
                            _logger.LogWarning("Currency conversion failed for {FromCurrency} to {ToCurrency}: {Error}", 
                                request.FromCurrency, request.ToCurrency, result.ErrorMessage);
                            conversionResults[request.FromCurrency] = request.Amount; // Use original as fallback
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Batch currency conversion failed for dashboard stats");
                // Enhanced error logging and fallback handling
                foreach (var group in currencyGroups.Where(g => g.Key != targetCurrency))
                {
                    var originalAmount = group.Sum(s => s.GetMonthlyCost());
                    conversionResults[group.Key] = originalAmount; // Use original as fallback
                }
            }
        }

        // Process each currency group using optimized batch conversion results
        foreach (var group in currencyGroups)
        {
            var originalAmount = group.Sum(s => s.GetMonthlyCost());
            var convertedAmount = originalAmount;

            // Use pre-calculated conversion result if available
            if (group.Key != targetCurrency)
            {
                if (conversionResults.TryGetValue(group.Key, out var preCalculatedAmount))
                {
                    convertedAmount = preCalculatedAmount;
                }
                else
                {
                    // This should rarely happen with optimized batch processing
                    try
                    {
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, group.Key, targetCurrency);
                    }
                    catch
                    {
                        // If conversion fails, use original amount as fallback
                        convertedAmount = originalAmount;
                    }
                }
            }

            currencyBreakdowns.Add(new CurrencyBreakdown
            {
                Currency = group.Key,
                OriginalAmount = originalAmount,
                ConvertedAmount = convertedAmount,
                SubscriptionCount = group.Count()
            });

            totalConvertedMonthlyCost += convertedAmount;
        }

        // Calculate annual cost
        var totalAnnualCost = totalConvertedMonthlyCost * 12;

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
            TotalMonthlyCost = totalConvertedMonthlyCost,
            TotalAnnualCost = totalAnnualCost,
            UpcomingBills = upcomingBills,
            TrialEnding = trialsEnding,
            DaysUntilNextBilling = daysUntilNextBilling,
            DisplayCurrency = targetCurrency,
            CurrencyBreakdowns = currencyBreakdowns
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

    [HttpGet("monthly-spending")]
    public async Task<ActionResult<IEnumerable<MonthlySpendingDto>>> GetMonthlySpending([FromQuery] string? displayCurrency = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var monthlyData = new List<MonthlySpendingDto>();
        var currentDate = DateTime.UtcNow;

        // Get last 6 months of data
        for (int i = 5; i >= 0; i--)
        {
            var targetDate = currentDate.AddMonths(-i);
            var monthName = targetDate.ToString("MMM");
            
            // Calculate spending for subscriptions that were active during this month
            var activeSubscriptions = subscriptions
                .Where(s => s.CreatedAt <= targetDate.AddMonths(1).AddDays(-1) && 
                           (!s.CancellationDate.HasValue || s.CancellationDate.Value >= targetDate))
                .ToList();

            // Group by currency and convert to target currency using batch optimization
            var currencyGroups = activeSubscriptions.GroupBy(s => s.Currency).ToList();
            decimal totalConvertedSpending = 0;

            // Performance optimization: Use optimized exchange rates for monthly spending data
            var uniqueCurrencies = currencyGroups.Select(g => g.Key).Where(c => c != targetCurrency).ToHashSet();
            
            if (uniqueCurrencies.Any())
            {
                try
                {
                    // Performance optimization: Single optimized exchange rate call for all currencies
                    var optimizedRates = await _currencyConversionService.GetOptimizedExchangeRatesAsync(targetCurrency, uniqueCurrencies);
                    
                    // Calculate total converted spending using pre-fetched rates
                    foreach (var group in currencyGroups)
                    {
                        var originalAmount = group.Sum(s => s.GetMonthlyCost());
                        
                        if (group.Key == targetCurrency)
                        {
                            totalConvertedSpending += originalAmount;
                        }
                        else if (optimizedRates.TryGetValue(group.Key, out var rate))
                        {
                            totalConvertedSpending += originalAmount * rate;
                        }
                        else
                        {
                            totalConvertedSpending += originalAmount; // Fallback
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Fallback to original amounts on conversion failure
                    totalConvertedSpending = currencyGroups.Sum(g => g.Sum(s => s.GetMonthlyCost()));
                }
            }
            else
            {
                // No conversion needed - all currencies match target
                totalConvertedSpending = currencyGroups.Sum(g => g.Sum(s => s.GetMonthlyCost()));
            }

            monthlyData.Add(new MonthlySpendingDto
            {
                Name = monthName,
                Value = totalConvertedSpending
            });
        }

        return Ok(monthlyData);
    }

    [HttpGet("category-spending")]
    public async Task<ActionResult<IEnumerable<CategorySpendingDto>>> GetCategorySpending([FromQuery] string? displayCurrency = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        // Get subscriptions and calculate on client side
        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .Include(s => s.Category)
            .ToListAsync();

        var categorySpending = new List<CategorySpendingDto>();

        var categoryGroups = subscriptions.GroupBy(s => s.Category);

        // Pre-fetch exchange rates for all unique currencies using optimized batch operations
        var allUniqueCurrencies = subscriptions.Select(s => s.Currency).Where(c => c != targetCurrency).ToHashSet();
        var exchangeRates = await _currencyConversionService.GetOptimizedExchangeRatesAsync(targetCurrency, allUniqueCurrencies);

        foreach (var categoryGroup in categoryGroups)
        {
            // Group subscriptions in this category by currency
            var currencyGroups = categoryGroup.GroupBy(s => s.Currency);
            decimal totalConvertedAmount = 0;

            foreach (var currencyGroup in currencyGroups)
            {
                var originalAmount = currencyGroup.Sum(s => s.GetMonthlyCost());
                var convertedAmount = originalAmount;

                // Convert to target currency if different using pre-fetched rates
                if (currencyGroup.Key != targetCurrency)
                {
                    if (exchangeRates.TryGetValue(currencyGroup.Key, out var rate))
                    {
                        convertedAmount = originalAmount * rate;
                    }
                    else
                    {
                        try
                        {
                            convertedAmount = await _currencyConversionService.ConvertAsync(
                                originalAmount, currencyGroup.Key, targetCurrency);
                        }
                        catch
                        {
                            convertedAmount = originalAmount;
                        }
                    }
                }

                totalConvertedAmount += convertedAmount;
            }

            categorySpending.Add(new CategorySpendingDto
            {
                Name = categoryGroup.Key.Name,
                Value = totalConvertedAmount,
                Color = categoryGroup.Key.Color
            });
        }

        return Ok(categorySpending);
    }

    [HttpGet("upcoming-bills")]
    public async Task<ActionResult<IEnumerable<UpcomingBillDto>>> GetUpcomingBills([FromQuery] string? displayCurrency = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var currentDate = DateTime.UtcNow;
        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive && 
                       s.NextBillingDate <= currentDate.AddDays(7) &&
                       s.NextBillingDate > currentDate)
            .Include(s => s.Category)
            .OrderBy(s => s.NextBillingDate)
            .Take(5)
            .ToListAsync();

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var upcomingBills = new List<UpcomingBillDto>();

        foreach (var subscription in subscriptions)
        {
            var bill = new UpcomingBillDto
            {
                Id = subscription.Id,
                Name = subscription.Name,
                Amount = subscription.Cost,
                Currency = subscription.Currency,
                Date = subscription.NextBillingDate,
                CategoryName = subscription.Category.Name,
                CategoryColor = subscription.Category.Color
            };

            // Convert currency if needed
            if (subscription.Currency != targetCurrency)
            {
                try
                {
                    var convertedAmount = await _currencyConversionService.ConvertAsync(
                        subscription.Cost, subscription.Currency, targetCurrency);
                    
                    bill.ConvertedAmount = convertedAmount;
                    bill.ConvertedCurrency = targetCurrency;
                    bill.IsConverted = true;
                }
                catch
                {
                    // If conversion fails, keep original values
                    bill.IsConverted = false;
                }
            }
            else
            {
                bill.IsConverted = false;
            }

            upcomingBills.Add(bill);
        }

        return Ok(upcomingBills);
    }

    [HttpGet("recent-activity")]
    public async Task<ActionResult<IEnumerable<RecentActivityDto>>> GetRecentActivity()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var recentSubscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .Include(s => s.Category)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(5)
            .Select(s => new RecentActivityDto
            {
                Id = s.Id,
                Type = s.CreatedAt == s.UpdatedAt ? "created" : "updated",
                Title = s.CreatedAt == s.UpdatedAt ? $"Added {s.Name}" : $"Updated {s.Name}",
                Description = $"${s.Cost:F2} {s.BillingCycle.ToString().ToLower()}",
                Timestamp = s.UpdatedAt,
                CategoryColor = s.Category.Color
            })
            .ToListAsync();

        return Ok(recentSubscriptions);
    }

    [HttpGet("analytics/overview")]
    public async Task<ActionResult<AnalyticsOverviewDto>> GetAnalyticsOverview([FromQuery] string timeRange = "12months")
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var currentDate = DateTime.UtcNow;
        var startDate = timeRange switch
        {
            "3months" => currentDate.AddMonths(-3),
            "6months" => currentDate.AddMonths(-6),
            "12months" => currentDate.AddMonths(-12),
            "24months" => currentDate.AddMonths(-24),
            _ => currentDate.AddMonths(-12)
        };

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.CreatedAt >= startDate)
            .Include(s => s.Category)
            .ToListAsync();

        var activeSubscriptions = subscriptions.Where(s => s.IsActive).ToList();
        var totalSpent = subscriptions.Sum(s => s.GetMonthlyCost() * 
            (decimal)Math.Max(1, (currentDate - s.CreatedAt).TotalDays / 30.44)); // Average days per month

        var monthlyAverage = activeSubscriptions.Sum(s => s.GetMonthlyCost());
        
        // Calculate savings potential (inactive subscriptions that were recently active)
        var recentlyInactive = subscriptions
            .Where(s => !s.IsActive && s.CancellationDate.HasValue && 
                       s.CancellationDate.Value >= currentDate.AddMonths(-1))
            .Sum(s => s.GetMonthlyCost());

        var overview = new AnalyticsOverviewDto
        {
            TotalSpent = totalSpent,
            MonthlyAverage = monthlyAverage,
            ActiveSubscriptions = activeSubscriptions.Count,
            SavingsPotential = recentlyInactive,
            TimeRange = timeRange
        };

        return Ok(overview);
    }

    [HttpGet("analytics/monthly-spending-extended")]
    public async Task<ActionResult<IEnumerable<MonthlySpendingDto>>> GetExtendedMonthlySpending([FromQuery] string timeRange = "12months")
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var months = timeRange switch
        {
            "3months" => 3,
            "6months" => 6,
            "12months" => 12,
            "24months" => 24,
            _ => 12
        };

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var monthlyData = new List<MonthlySpendingDto>();
        var currentDate = DateTime.UtcNow;

        for (int i = months - 1; i >= 0; i--)
        {
            var targetDate = currentDate.AddMonths(-i);
            var monthName = targetDate.ToString("MMM");
            
            var activeSubscriptions = subscriptions
                .Where(s => s.CreatedAt <= targetDate.AddMonths(1).AddDays(-1) && 
                           (!s.CancellationDate.HasValue || s.CancellationDate.Value >= targetDate))
                .ToList();

            var monthlySpending = activeSubscriptions.Sum(s => s.GetMonthlyCost());

            monthlyData.Add(new MonthlySpendingDto
            {
                Name = monthName,
                Value = monthlySpending
            });
        }

        return Ok(monthlyData);
    }

    [HttpGet("analytics/yearly-comparison")]
    public async Task<ActionResult<IEnumerable<YearlyComparisonDto>>> GetYearlyComparison()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var currentYear = DateTime.UtcNow.Year;
        var yearlyData = new List<YearlyComparisonDto>();

        for (int year = currentYear - 2; year <= currentYear; year++)
        {
            var yearStart = new DateTime(year, 1, 1);
            var yearEnd = new DateTime(year, 12, 31);

            var yearlySpending = subscriptions
                .Where(s => s.CreatedAt <= yearEnd && 
                           (!s.CancellationDate.HasValue || s.CancellationDate.Value >= yearStart))
                .Sum(s => s.GetMonthlyCost() * 12); // Annualized

            yearlyData.Add(new YearlyComparisonDto
            {
                Year = year.ToString(),
                Value = yearlySpending
            });
        }

        return Ok(yearlyData);
    }

    [HttpGet("analytics/top-subscriptions")]
    public async Task<ActionResult<IEnumerable<TopSubscriptionDto>>> GetTopSubscriptions()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .Include(s => s.Category)
            .OrderByDescending(s => s.Cost)
            .Take(10)
            .ToListAsync();

        var topSubscriptions = subscriptions
            .Select(s => new TopSubscriptionDto
            {
                Id = s.Id,
                Name = s.Name,
                Cost = s.GetMonthlyCost(),
                CategoryName = s.Category.Name,
                CategoryColor = s.Category.Color,
                BillingCycle = s.BillingCycle.ToString(),
                Trend = "stable" // Could be enhanced with historical data
            })
            .ToList();

        return Ok(topSubscriptions);
    }

    [HttpGet("analytics/insights")]
    public async Task<ActionResult<IEnumerable<InsightDto>>> GetInsights()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .Include(s => s.Category)
            .ToListAsync();

        var insights = new List<InsightDto>();
        var currentDate = DateTime.UtcNow;

        // Check for duplicate categories
        var categoryGroups = subscriptions
            .Where(s => s.IsActive)
            .GroupBy(s => s.Category.Name)
            .Where(g => g.Count() > 1)
            .ToList();

        foreach (var group in categoryGroups)
        {
            var potentialSavings = group.Skip(1).Sum(s => s.GetMonthlyCost());
            insights.Add(new InsightDto
            {
                Type = "warning",
                Title = $"Multiple {group.Key} Services",
                Description = $"You have {group.Count()} active {group.Key.ToLower()} subscriptions. Consider consolidating.",
                Savings = potentialSavings,
                Action = "Review Services"
            });
        }

        // Check for expensive subscriptions
        var expensiveSubscriptions = subscriptions
            .Where(s => s.IsActive && s.GetMonthlyCost() > 50)
            .ToList();

        if (expensiveSubscriptions.Any())
        {
            insights.Add(new InsightDto
            {
                Type = "info",
                Title = "High-Cost Subscriptions",
                Description = $"You have {expensiveSubscriptions.Count} subscriptions over $50/month.",
                Savings = 0,
                Action = "Review Pricing"
            });
        }

        // Check for trials ending soon
        var endingTrials = subscriptions
            .Where(s => s.IsActive && s.IsTrial && s.TrialEndDate.HasValue &&
                       s.TrialEndDate.Value <= currentDate.AddDays(7))
            .ToList();

        if (endingTrials.Any())
        {
            insights.Add(new InsightDto
            {
                Type = "warning",
                Title = "Trials Ending Soon",
                Description = $"{endingTrials.Count} trial subscriptions are ending within 7 days.",
                Savings = endingTrials.Sum(s => s.GetMonthlyCost()),
                Action = "Review Trials"
            });
        }

        return Ok(insights.Take(5));
    }

    [HttpGet("analytics/spending-patterns")]
    public async Task<ActionResult<SpendingPatternsDto>> GetSpendingPatterns()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var currentDate = DateTime.UtcNow;

        // Most active day (most common billing day)
        var billingDays = subscriptions
            .Where(s => s.IsActive)
            .GroupBy(s => s.NextBillingDate.Day)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault();

        // Average service life
        var canceledSubscriptions = subscriptions
            .Where(s => s.CancellationDate.HasValue)
            .ToList();

        var averageServiceLife = canceledSubscriptions.Any() 
            ? canceledSubscriptions.Average(s => (s.CancellationDate!.Value - s.CreatedAt).TotalDays / 30.44)
            : 0;

        // Cancellation rate (within 3 months)
        var recentSubscriptions = subscriptions
            .Where(s => s.CreatedAt >= currentDate.AddMonths(-3))
            .ToList();

        var cancellationRate = recentSubscriptions.Any()
            ? (double)recentSubscriptions.Count(s => s.CancellationDate.HasValue) / recentSubscriptions.Count * 100
            : 0;

        // Peak spending month
        var monthlySpending = new Dictionary<int, decimal>();
        for (int month = 1; month <= 12; month++)
        {
            var monthSubscriptions = subscriptions
                .Where(s => s.CreatedAt.Month == month || 
                           (s.NextBillingDate.Month == month && s.IsActive))
                .ToList();
            monthlySpending[month] = monthSubscriptions.Sum(s => s.GetMonthlyCost());
        }

        var peakMonth = monthlySpending.OrderByDescending(kvp => kvp.Value).FirstOrDefault();

        var patterns = new SpendingPatternsDto
        {
            MostActiveDay = billingDays?.Key ?? 15,
            AverageServiceLifeMonths = averageServiceLife,
            CancellationRate = cancellationRate,
            PeakSpendingMonth = new DateTime(currentDate.Year, peakMonth.Key, 1).ToString("MMMM")
        };

        return Ok(patterns);
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
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

            // Calculate total converted spending using proper currency conversion
            foreach (var group in currencyGroups)
            {
                var originalAmount = group.Sum(s => s.GetMonthlyCost());
                var convertedAmount = originalAmount;
                
                // Convert if needed
                if (group.Key != targetCurrency)
                {
                    try
                    {
                        // Always use the ConvertAsync method to ensure correct conversion
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, group.Key, targetCurrency);
                        
                        _logger.LogInformation("Monthly Spending: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                            originalAmount, group.Key, convertedAmount, targetCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Monthly Spending: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                            originalAmount, group.Key, targetCurrency);
                        // Use original as fallback
                        convertedAmount = originalAmount;
                    }
                }
                
                totalConvertedSpending += convertedAmount;
            }

            // Debug logging for monthly spending
            _logger.LogInformation("Monthly Spending Debug: {Month} - Original subscriptions: {Count}, Total converted: {Amount} {Currency}", 
                monthName, activeSubscriptions.Count, totalConvertedSpending, targetCurrency);

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

                // Convert to target currency if different
                if (currencyGroup.Key != targetCurrency)
                {
                    try
                    {
                        // Always use the ConvertAsync method to ensure correct conversion
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, currencyGroup.Key, targetCurrency);
                        
                        _logger.LogInformation("Category Spending: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                            originalAmount, currencyGroup.Key, convertedAmount, targetCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Category Spending: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                            originalAmount, currencyGroup.Key, targetCurrency);
                        // Use original as fallback
                        convertedAmount = originalAmount;
                    }
                }

                totalConvertedAmount += convertedAmount;
            }

            categorySpending.Add(new CategorySpendingDto
            {
                Name = categoryGroup.Key.Name,
                Value = totalConvertedAmount,
                Color = categoryGroup.Key.Color,
                Currency = targetCurrency
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
    public async Task<ActionResult<AnalyticsOverviewDto>> GetAnalyticsOverview([FromQuery] string timeRange = "12months", [FromQuery] string? displayCurrency = null)
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

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.CreatedAt >= startDate)
            .Include(s => s.Category)
            .ToListAsync();

        var activeSubscriptions = subscriptions.Where(s => s.IsActive).ToList();
        
        // Group subscriptions by currency for conversion
        var currencyGroups = subscriptions.GroupBy(s => s.Currency).ToList();
        decimal totalConvertedSpent = 0;
        decimal totalConvertedMonthlyAverage = 0;
        decimal totalConvertedSavingsPotential = 0;

        // Warm cache for common currency pairs to improve performance
        await _currencyConversionService.WarmCacheForCommonCurrencyPairsAsync(targetCurrency);

        // Get unique currencies for batch conversion
        var uniqueCurrencies = currencyGroups.Select(g => g.Key).Where(c => c != targetCurrency).ToHashSet();
        
        // Pre-fetch exchange rates for all currencies
        var exchangeRates = await _currencyConversionService.GetOptimizedExchangeRatesAsync(targetCurrency, uniqueCurrencies);

        // Calculate total spent with currency conversion
        foreach (var group in currencyGroups)
        {
            var originalSpent = group.Sum(s => s.GetMonthlyCost() * 
                (decimal)Math.Max(1, (currentDate - s.CreatedAt).TotalDays / 30.44));
            
            var convertedSpent = originalSpent;
            
            // Convert if needed
            if (group.Key != targetCurrency)
            {
                try
                {
                    // Always use the ConvertAsync method to ensure correct conversion
                    convertedSpent = await _currencyConversionService.ConvertAsync(
                        originalSpent, group.Key, targetCurrency);
                    
                    _logger.LogInformation("Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency} for analytics",
                        originalSpent, group.Key, convertedSpent, targetCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                        originalSpent, group.Key, targetCurrency);
                    // Use original as fallback
                    convertedSpent = originalSpent;
                }
            }
            
            totalConvertedSpent += convertedSpent;
        }

        // Calculate monthly average with currency conversion
        var activeGroups = activeSubscriptions.GroupBy(s => s.Currency).ToList();
        foreach (var group in activeGroups)
        {
            var originalMonthly = group.Sum(s => s.GetMonthlyCost());
            var convertedMonthly = originalMonthly;
            
            // Convert if needed
            if (group.Key != targetCurrency)
            {
                try
                {
                    // Always use the ConvertAsync method to ensure correct conversion
                    convertedMonthly = await _currencyConversionService.ConvertAsync(
                        originalMonthly, group.Key, targetCurrency);
                    
                    _logger.LogInformation("Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency} for monthly average",
                        originalMonthly, group.Key, convertedMonthly, targetCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                        originalMonthly, group.Key, targetCurrency);
                    // Use original as fallback
                    convertedMonthly = originalMonthly;
                }
            }
            
            totalConvertedMonthlyAverage += convertedMonthly;
        }
        
        // Calculate savings potential with currency conversion
        var recentlyInactiveGroups = subscriptions
            .Where(s => !s.IsActive && s.CancellationDate.HasValue && 
                       s.CancellationDate.Value >= currentDate.AddMonths(-1))
            .GroupBy(s => s.Currency)
            .ToList();
            
        foreach (var group in recentlyInactiveGroups)
        {
            var originalSavings = group.Sum(s => s.GetMonthlyCost());
            var convertedSavings = originalSavings;
            
            // Convert if needed
            if (group.Key != targetCurrency)
            {
                try
                {
                    // Always use the ConvertAsync method to ensure correct conversion
                    convertedSavings = await _currencyConversionService.ConvertAsync(
                        originalSavings, group.Key, targetCurrency);
                    
                    _logger.LogInformation("Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency} for savings potential",
                        originalSavings, group.Key, convertedSavings, targetCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                        originalSavings, group.Key, targetCurrency);
                    // Use original as fallback
                    convertedSavings = originalSavings;
                }
            }
            
            totalConvertedSavingsPotential += convertedSavings;
        }

        var overview = new AnalyticsOverviewDto
        {
            TotalSpent = totalConvertedSpent,
            MonthlyAverage = totalConvertedMonthlyAverage,
            ActiveSubscriptions = activeSubscriptions.Count,
            SavingsPotential = totalConvertedSavingsPotential,
            TimeRange = timeRange,
            DisplayCurrency = targetCurrency
        };

        return Ok(overview);
    }

    [HttpGet("analytics/monthly-spending-extended")]
    public async Task<ActionResult<IEnumerable<MonthlySpendingDto>>> GetExtendedMonthlySpending([FromQuery] string timeRange = "12months", [FromQuery] string? displayCurrency = null)
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

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var monthlyData = new List<MonthlySpendingDto>();
        var currentDate = DateTime.UtcNow;

        // Pre-fetch exchange rates for all unique currencies
        var uniqueCurrencies = subscriptions.Select(s => s.Currency).Where(c => c != targetCurrency).Distinct().ToHashSet();
        var exchangeRates = await _currencyConversionService.GetOptimizedExchangeRatesAsync(targetCurrency, uniqueCurrencies);

        for (int i = months - 1; i >= 0; i--)
        {
            var targetDate = currentDate.AddMonths(-i);
            var monthName = targetDate.ToString("MMM");
            
            var activeSubscriptions = subscriptions
                .Where(s => s.CreatedAt <= targetDate.AddMonths(1).AddDays(-1) && 
                           (!s.CancellationDate.HasValue || s.CancellationDate.Value >= targetDate))
                .ToList();

            // Group by currency for conversion
            var currencyGroups = activeSubscriptions.GroupBy(s => s.Currency).ToList();
            decimal totalConvertedSpending = 0;

            foreach (var group in currencyGroups)
            {
                var originalAmount = group.Sum(s => s.GetMonthlyCost());
                var convertedAmount = originalAmount;
                
                // Convert if needed
                if (group.Key != targetCurrency)
                {
                    try
                    {
                        // Always use the ConvertAsync method to ensure correct conversion
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, group.Key, targetCurrency);
                        
                        _logger.LogInformation("Monthly Spending: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                            originalAmount, group.Key, convertedAmount, targetCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Monthly Spending: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                            originalAmount, group.Key, targetCurrency);
                        // Use original as fallback
                        convertedAmount = originalAmount;
                    }
                }
                
                totalConvertedSpending += convertedAmount;
            }

            monthlyData.Add(new MonthlySpendingDto
            {
                Name = monthName,
                Value = totalConvertedSpending,
                Currency = targetCurrency
            });
        }

        return Ok(monthlyData);
    }

    [HttpGet("analytics/yearly-comparison")]
    public async Task<ActionResult<IEnumerable<YearlyComparisonDto>>> GetYearlyComparison([FromQuery] string? displayCurrency = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        // Pre-fetch exchange rates for all unique currencies
        var uniqueCurrencies = subscriptions.Select(s => s.Currency).Where(c => c != targetCurrency).Distinct().ToHashSet();
        var exchangeRates = await _currencyConversionService.GetOptimizedExchangeRatesAsync(targetCurrency, uniqueCurrencies);

        var currentYear = DateTime.UtcNow.Year;
        var yearlyData = new List<YearlyComparisonDto>();

        for (int year = currentYear - 2; year <= currentYear; year++)
        {
            var yearStart = new DateTime(year, 1, 1);
            var yearEnd = new DateTime(year, 12, 31);

            var yearSubscriptions = subscriptions
                .Where(s => s.CreatedAt <= yearEnd && 
                           (!s.CancellationDate.HasValue || s.CancellationDate.Value >= yearStart))
                .ToList();
                
            // Group by currency for conversion
            var currencyGroups = yearSubscriptions.GroupBy(s => s.Currency).ToList();
            decimal totalConvertedYearlySpending = 0;

            foreach (var group in currencyGroups)
            {
                var originalAmount = group.Sum(s => s.GetMonthlyCost() * 12); // Annualized
                var convertedAmount = originalAmount;
                
                // Convert if needed
                if (group.Key != targetCurrency)
                {
                    try
                    {
                        // Always use the ConvertAsync method to ensure correct conversion
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, group.Key, targetCurrency);
                        
                        _logger.LogInformation("Yearly Comparison: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                            originalAmount, group.Key, convertedAmount, targetCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Yearly Comparison: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                            originalAmount, group.Key, targetCurrency);
                        // Use original as fallback
                        convertedAmount = originalAmount;
                    }
                }
                
                totalConvertedYearlySpending += convertedAmount;
            }

            yearlyData.Add(new YearlyComparisonDto
            {
                Year = year.ToString(),
                Value = totalConvertedYearlySpending,
                Currency = targetCurrency
            });
        }

        return Ok(yearlyData);
    }

    [HttpGet("analytics/top-subscriptions")]
    public async Task<ActionResult<IEnumerable<TopSubscriptionDto>>> GetTopSubscriptions([FromQuery] string? displayCurrency = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .Include(s => s.Category)
            .ToListAsync();
            
        // Sort by cost after conversion
        var topSubscriptionsWithConversion = new List<TopSubscriptionDto>();
        
        foreach (var subscription in subscriptions)
        {
            var originalCost = subscription.GetMonthlyCost();
            var convertedCost = originalCost;
            
            // Convert if needed
            if (subscription.Currency != targetCurrency)
            {
                try
                {
                    // Always use the ConvertAsync method to ensure correct conversion
                    convertedCost = await _currencyConversionService.ConvertAsync(
                        originalCost, subscription.Currency, targetCurrency);
                    
                    _logger.LogInformation("Top Subscriptions: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                        originalCost, subscription.Currency, convertedCost, targetCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Top Subscriptions: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                        originalCost, subscription.Currency, targetCurrency);
                    // Use original as fallback
                    convertedCost = originalCost;
                }
            }
            
            topSubscriptionsWithConversion.Add(new TopSubscriptionDto
            {
                Id = subscription.Id,
                Name = subscription.Name,
                Cost = convertedCost,
                OriginalCost = originalCost,
                OriginalCurrency = subscription.Currency,
                CategoryName = subscription.Category.Name,
                CategoryColor = subscription.Category.Color,
                BillingCycle = subscription.BillingCycle.ToString(),
                Trend = "stable", // Could be enhanced with historical data
                Currency = targetCurrency
            });
        }

        // Sort by converted cost and take top 10
        var topSubscriptions = topSubscriptionsWithConversion
            .OrderByDescending(s => s.Cost)
            .Take(10)
            .ToList();

        return Ok(topSubscriptions);
    }

    [HttpGet("analytics/insights")]
    public async Task<ActionResult<IEnumerable<InsightDto>>> GetInsights([FromQuery] string? displayCurrency = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var subscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .Include(s => s.Category)
            .ToListAsync();

        // Pre-fetch exchange rates for all unique currencies
        var uniqueCurrencies = subscriptions.Select(s => s.Currency).Where(c => c != targetCurrency).Distinct().ToHashSet();
        var exchangeRates = await _currencyConversionService.GetOptimizedExchangeRatesAsync(targetCurrency, uniqueCurrencies);

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
            // Group by currency for conversion
            var currencyGroups = group.Skip(1).GroupBy(s => s.Currency).ToList();
            decimal totalConvertedSavings = 0;

            foreach (var currencyGroup in currencyGroups)
            {
                var originalAmount = currencyGroup.Sum(s => s.GetMonthlyCost());
                var convertedAmount = originalAmount;
                
                // Convert if needed
                if (currencyGroup.Key != targetCurrency)
                {
                    try
                    {
                        // Always use the ConvertAsync method to ensure correct conversion
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, currencyGroup.Key, targetCurrency);
                        
                        _logger.LogInformation("Insights: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                            originalAmount, currencyGroup.Key, convertedAmount, targetCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Insights: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                            originalAmount, currencyGroup.Key, targetCurrency);
                        // Use original as fallback
                        convertedAmount = originalAmount;
                    }
                }
                
                totalConvertedSavings += convertedAmount;
            }

            insights.Add(new InsightDto
            {
                Type = "warning",
                Title = $"Multiple {group.Key} Services",
                Description = $"You have {group.Count()} active {group.Key.ToLower()} subscriptions. Consider consolidating.",
                Savings = totalConvertedSavings,
                Action = "Review Services",
                Currency = targetCurrency
            });
        }

        // Check for expensive subscriptions - use converted amounts for threshold
        var expensiveSubscriptions = new List<(Models.Subscription subscription, decimal convertedCost)>();
        
        foreach (var subscription in subscriptions.Where(s => s.IsActive))
        {
            var originalCost = subscription.GetMonthlyCost();
            var convertedCost = originalCost;
            
            // Convert if needed
            if (subscription.Currency != targetCurrency)
            {
                try
                {
                    // Always use the ConvertAsync method to ensure correct conversion
                    convertedCost = await _currencyConversionService.ConvertAsync(
                        originalCost, subscription.Currency, targetCurrency);
                    
                    _logger.LogInformation("Expensive Subscriptions: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                        originalCost, subscription.Currency, convertedCost, targetCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Expensive Subscriptions: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                        originalCost, subscription.Currency, targetCurrency);
                    // Use original as fallback
                    convertedCost = originalCost;
                }
            }
            
            if (convertedCost > 50) // Use converted cost for threshold
            {
                expensiveSubscriptions.Add((subscription, convertedCost));
            }
        }

        if (expensiveSubscriptions.Any())
        {
            insights.Add(new InsightDto
            {
                Type = "info",
                Title = "High-Cost Subscriptions",
                Description = $"You have {expensiveSubscriptions.Count} subscriptions over {formatCurrency(50, targetCurrency)}/month.",
                Savings = 0,
                Action = "Review Pricing",
                Currency = targetCurrency
            });
        }

        // Check for trials ending soon
        var endingTrials = subscriptions
            .Where(s => s.IsActive && s.IsTrial && s.TrialEndDate.HasValue &&
                       s.TrialEndDate.Value <= currentDate.AddDays(7))
            .ToList();

        if (endingTrials.Any())
        {
            // Group by currency for conversion
            var trialGroups = endingTrials.GroupBy(s => s.Currency).ToList();
            decimal totalConvertedTrialSavings = 0;

            foreach (var trialGroup in trialGroups)
            {
                var originalAmount = trialGroup.Sum(s => s.GetMonthlyCost());
                var convertedAmount = originalAmount;
                
                // Convert if needed
                if (trialGroup.Key != targetCurrency)
                {
                    try
                    {
                        // Always use the ConvertAsync method to ensure correct conversion
                        convertedAmount = await _currencyConversionService.ConvertAsync(
                            originalAmount, trialGroup.Key, targetCurrency);
                        
                        _logger.LogInformation("Trials Ending: Converted {OriginalAmount} {FromCurrency} to {ConvertedAmount} {ToCurrency}",
                            originalAmount, trialGroup.Key, convertedAmount, targetCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Trials Ending: Failed to convert {OriginalAmount} {FromCurrency} to {ToCurrency}", 
                            originalAmount, trialGroup.Key, targetCurrency);
                        // Use original as fallback
                        convertedAmount = originalAmount;
                    }
                }
                
                totalConvertedTrialSavings += convertedAmount;
            }

            insights.Add(new InsightDto
            {
                Type = "warning",
                Title = "Trials Ending Soon",
                Description = $"{endingTrials.Count} trial subscriptions are ending within 7 days.",
                Savings = totalConvertedTrialSavings,
                Action = "Review Trials",
                Currency = targetCurrency
            });
        }

        return Ok(insights.Take(5));
    }
    
    // Helper method for formatting currency in descriptions
    private string formatCurrency(decimal amount, string currency)
    {
        string symbol = currency switch
        {
            "USD" => "$",
            "EUR" => "€",
            "GBP" => "£",
            "INR" => "₹",
            "JPY" => "¥",
            _ => "$"
        };
        
        return $"{symbol}{amount}";
    }
    
    // Debug endpoint to check exchange rates
    [HttpGet("debug/exchange-rates")]
    public async Task<ActionResult> GetExchangeRates([FromQuery] string fromCurrency = "USD", [FromQuery] string toCurrency = "INR")
    {
        try
        {
            // Get exchange rate
            var result = await _currencyConversionService.ConvertWithMetadataAsync(1, fromCurrency, toCurrency);
            
            // Test conversion with a specific amount
            var testAmount = 20.0m;
            var convertedResult = await _currencyConversionService.ConvertWithMetadataAsync(testAmount, fromCurrency, toCurrency);
            
            return Ok(new
            {
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency,
                ExchangeRate = result.ExchangeRate,
                TestAmount = testAmount,
                ConvertedAmount = convertedResult.ConvertedAmount,
                Timestamp = result.RateTimestamp,
                IsStale = result.IsStale
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    // Debug endpoint to check monthly spending calculation
    [HttpGet("debug/monthly-spending")]
    public async Task<ActionResult> GetMonthlySpendingDebug([FromQuery] string? displayCurrency = null)
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

        // Get user's preferred currency or default to USD
        var user = await _context.Users.FindAsync(userId);
        var targetCurrency = displayCurrency ?? user?.Currency ?? "USD";

        var debugInfo = new List<object>();
        var currentDate = DateTime.UtcNow;

        // Get current month data for debugging
        var targetDate = currentDate;
        var monthName = targetDate.ToString("MMM");
        
        var activeSubscriptions = subscriptions
            .Where(s => s.CreatedAt <= targetDate.AddMonths(1).AddDays(-1) && 
                       (!s.CancellationDate.HasValue || s.CancellationDate.Value >= targetDate))
            .ToList();

        foreach (var subscription in activeSubscriptions)
        {
            var monthlyCost = subscription.GetMonthlyCost();
            var convertedCost = monthlyCost;
            
            if (subscription.Currency != targetCurrency)
            {
                try
                {
                    convertedCost = await _currencyConversionService.ConvertAsync(
                        monthlyCost, subscription.Currency, targetCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Debug: Failed to convert {Amount} {FromCurrency} to {ToCurrency}", 
                        monthlyCost, subscription.Currency, targetCurrency);
                }
            }

            debugInfo.Add(new
            {
                SubscriptionName = subscription.Name,
                OriginalCost = subscription.Cost,
                OriginalCurrency = subscription.Currency,
                BillingCycle = subscription.BillingCycle.ToString(),
                MonthlyCost = monthlyCost,
                ConvertedCost = convertedCost,
                TargetCurrency = targetCurrency
            });
        }

        var totalConverted = debugInfo.Sum(d => (decimal)((dynamic)d).ConvertedCost);

        return Ok(new
        {
            Month = monthName,
            TargetCurrency = targetCurrency,
            TotalActiveSubscriptions = activeSubscriptions.Count,
            TotalConvertedSpending = totalConverted,
            SubscriptionDetails = debugInfo
        });
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
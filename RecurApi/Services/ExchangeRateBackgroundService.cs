using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.Models;

namespace RecurApi.Services;

public class ExchangeRateBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExchangeRateBackgroundService> _logger;
    private readonly IMemoryCache _memoryCache;
    private readonly TimeSpan _updateInterval = TimeSpan.FromHours(1); // Update every hour
    
    // Common currency pairs to warm cache
    private readonly string[] _commonCurrencies = {"USD", "INR" };

    public ExchangeRateBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ExchangeRateBackgroundService> logger,
        IMemoryCache memoryCache)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _memoryCache = memoryCache;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Exchange Rate Background Service started");

        // Initial cache warming
        await WarmCacheAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateExchangeRatesAsync();
                await Task.Delay(_updateInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Exchange Rate Background Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating exchange rates");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Retry after 5 minutes on error
            }
        }
    }

    private async Task WarmCacheAsync()
    {
        _logger.LogInformation("Warming exchange rate cache with common currency pairs");
        
        using var scope = _serviceProvider.CreateScope();
        var exchangeRateProvider = scope.ServiceProvider.GetRequiredService<IExchangeRateProvider>();
        
        // Process currency pairs sequentially to avoid concurrency issues
        foreach (var baseCurrency in _commonCurrencies)
        {
            foreach (var targetCurrency in _commonCurrencies)
            {
                if (baseCurrency != targetCurrency)
                {
                    await WarmCurrencyPairAsync(exchangeRateProvider, baseCurrency, targetCurrency);
                }
            }
        }
        
        _logger.LogInformation("Cache warming completed");
    }

    private async Task WarmCurrencyPairAsync(IExchangeRateProvider exchangeRateProvider, string fromCurrency, string toCurrency)
    {
        try
        {
            await exchangeRateProvider.GetExchangeRateAsync(fromCurrency, toCurrency);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to warm cache for {FromCurrency} to {ToCurrency}", fromCurrency, toCurrency);
        }
    }

    private async Task UpdateExchangeRatesAsync()
    {
        _logger.LogInformation("Starting scheduled exchange rate update");
        
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<RecurDbContext>();
        var exchangeRateProvider = scope.ServiceProvider.GetRequiredService<IExchangeRateProvider>();
        
        // Get all unique currency pairs from existing subscriptions
        var currencyPairs = await GetActiveCurrencyPairsAsync(dbContext);
        
        // Add common currency pairs
        foreach (var baseCurrency in _commonCurrencies)
        {
            foreach (var targetCurrency in _commonCurrencies)
            {
                if (baseCurrency != targetCurrency)
                {
                    currencyPairs.Add((baseCurrency, targetCurrency));
                }
            }
        }
        
        // Process currency pairs sequentially to avoid concurrency issues
        foreach (var pair in currencyPairs.Distinct())
        {
            await UpdateCurrencyPairAsync(exchangeRateProvider, pair.fromCurrency, pair.toCurrency);
        }
        
        // Clean up expired rates
        await CleanupExpiredRatesAsync(dbContext);
        
        _logger.LogInformation("Scheduled exchange rate update completed");
    }

    private async Task<HashSet<(string fromCurrency, string toCurrency)>> GetActiveCurrencyPairsAsync(RecurDbContext dbContext)
    {
        var pairs = new HashSet<(string, string)>();
        
        // Get all unique currencies from subscriptions
        var currencies = await dbContext.Subscriptions
            .Where(s => !string.IsNullOrEmpty(s.Currency))
            .Select(s => s.Currency)
            .Distinct()
            .ToListAsync();
        
        // Get all unique user default currencies
        var userCurrencies = await dbContext.UserSettings
            .Where(us => !string.IsNullOrEmpty(us.DefaultCurrency))
            .Select(us => us.DefaultCurrency)
            .Distinct()
            .ToListAsync();
        
        var allCurrencies = currencies.Concat(userCurrencies).Distinct().ToList();
        
        // Create pairs between all currencies
        foreach (var fromCurrency in allCurrencies)
        {
            foreach (var toCurrency in allCurrencies)
            {
                if (fromCurrency != toCurrency)
                {
                    pairs.Add((fromCurrency, toCurrency));
                }
            }
        }
        
        return pairs;
    }

    private async Task UpdateCurrencyPairAsync(IExchangeRateProvider exchangeRateProvider, string fromCurrency, string toCurrency)
    {
        try
        {
            await exchangeRateProvider.GetExchangeRateAsync(fromCurrency, toCurrency);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update exchange rate for {FromCurrency} to {ToCurrency}", fromCurrency, toCurrency);
        }
    }

    private async Task CleanupExpiredRatesAsync(RecurDbContext dbContext)
    {
        var expiredRates = dbContext.ExchangeRates
            .Where(er => er.ExpiresAt < DateTime.UtcNow);
        
        dbContext.ExchangeRates.RemoveRange(expiredRates);
        var deletedCount = await dbContext.SaveChangesAsync();
        
        if (deletedCount > 0)
        {
            _logger.LogInformation("Cleaned up {Count} expired exchange rates", deletedCount);
        }
    }
}
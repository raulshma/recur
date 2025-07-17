using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RecurApi.Services;

public class CurrencyOptimizationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CurrencyOptimizationBackgroundService> _logger;
    
    // Performance optimization intervals
    private readonly TimeSpan _cacheCleanupInterval = TimeSpan.FromHours(6); // Clean up every 6 hours
    private readonly TimeSpan _cacheWarmingInterval = TimeSpan.FromHours(2); // Warm cache every 2 hours
    private readonly TimeSpan _frequentPairsUpdateInterval = TimeSpan.FromHours(12); // Update frequent pairs every 12 hours

    public CurrencyOptimizationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<CurrencyOptimizationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Currency optimization background service started");

        var lastCacheCleanup = DateTime.MinValue;
        var lastCacheWarming = DateTime.MinValue;
        var lastFrequentPairsUpdate = DateTime.MinValue;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Perform cache cleanup
                if (now - lastCacheCleanup >= _cacheCleanupInterval)
                {
                    await PerformCacheCleanupAsync();
                    lastCacheCleanup = now;
                }

                // Perform cache warming for common currencies
                if (now - lastCacheWarming >= _cacheWarmingInterval)
                {
                    await PerformCacheWarmingAsync();
                    lastCacheWarming = now;
                }

                // Update frequently used currency pairs
                if (now - lastFrequentPairsUpdate >= _frequentPairsUpdateInterval)
                {
                    await UpdateFrequentlyUsedPairsAsync();
                    lastFrequentPairsUpdate = now;
                }

                // Wait for 30 minutes before next check
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in currency optimization background service");
                // Wait a bit longer on error to avoid rapid retries
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("Currency optimization background service stopped");
    }

    private async Task PerformCacheCleanupAsync()
    {
        try
        {
            _logger.LogInformation("Starting scheduled cache cleanup");
            
            using var scope = _serviceProvider.CreateScope();
            var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyConversionService>();
            
            await currencyService.CleanupExpiredCacheEntriesAsync();
            
            _logger.LogInformation("Scheduled cache cleanup completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scheduled cache cleanup");
        }
    }

    private async Task PerformCacheWarmingAsync()
    {
        try
        {
            _logger.LogInformation("Starting scheduled cache warming");
            
            using var scope = _serviceProvider.CreateScope();
            var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyConversionService>();
            
            // Warm cache for common base currencies
            var commonBaseCurrencies = new[] { "USD", "INR" };
            
            foreach (var baseCurrency in commonBaseCurrencies)
            {
                try
                {
                    await currencyService.WarmCacheForCommonCurrencyPairsAsync(baseCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to warm cache for base currency {BaseCurrency}", baseCurrency);
                }
            }
            
            _logger.LogInformation("Scheduled cache warming completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scheduled cache warming");
        }
    }

    private async Task UpdateFrequentlyUsedPairsAsync()
    {
        try
        {
            _logger.LogInformation("Starting frequently used pairs update");
            
            using var scope = _serviceProvider.CreateScope();
            var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyConversionService>();
            
            // Get frequently used pairs for common base currencies and preload them
            var commonBaseCurrencies = new[] { "USD", "INR" };
            var frequentPairs = new List<(string from, string to)>();
            
            foreach (var baseCurrency in commonBaseCurrencies)
            {
                try
                {
                    var rates = await currencyService.GetFrequentlyUsedRatesAsync(baseCurrency);
                    foreach (var targetCurrency in rates.Keys)
                    {
                        if (targetCurrency != baseCurrency)
                        {
                            frequentPairs.Add((baseCurrency, targetCurrency));
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get frequently used rates for {BaseCurrency}", baseCurrency);
                }
            }
            
            if (frequentPairs.Any())
            {
                await currencyService.PreloadCurrencyPairsAsync(frequentPairs);
            }
            
            _logger.LogInformation("Frequently used pairs update completed with {Count} pairs", frequentPairs.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during frequently used pairs update");
        }
    }
}
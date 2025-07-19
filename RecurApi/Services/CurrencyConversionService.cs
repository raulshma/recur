using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using RecurApi.Data;
using RecurApi.Models;

namespace RecurApi.Services;

public class CurrencyConversionService : ICurrencyConversionService
{
    private readonly IExchangeRateProvider _exchangeRateProvider;
    private readonly RecurDbContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<CurrencyConversionService> _logger;
    
    private const int CacheExpirationHours = 1;
    private const int DatabaseCacheExpirationHours = 24;
    
    // Performance optimization constants
    private const int MaxBatchSize = 100; // Increased for better batch processing
    private const int CacheWarmingBatchSize = 30; // Optimized batch size
    private const int OptimizedQueryBatchSize = 50; // For database query optimization
    
    // Frequently used currency pairs for cache warming
    private static readonly string[] CommonCurrencies = { "USD", "INR" };

    public CurrencyConversionService(
        IExchangeRateProvider exchangeRateProvider,
        RecurDbContext context,
        IMemoryCache memoryCache,
        ILogger<CurrencyConversionService> logger)
    {
        _exchangeRateProvider = exchangeRateProvider;
        _context = context;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return amount;

        var result = await ConvertWithMetadataAsync(amount, fromCurrency, toCurrency);
        return result.ConvertedAmount;
    }

    public async Task<CurrencyConversionResult> ConvertWithMetadataAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        // Validate input parameters
        if (amount < 0)
        {
            _logger.LogWarning("Invalid amount for currency conversion: {Amount}", amount);
            throw new ArgumentException("Amount cannot be negative", nameof(amount));
        }

        if (string.IsNullOrWhiteSpace(fromCurrency) || string.IsNullOrWhiteSpace(toCurrency))
        {
            _logger.LogWarning("Invalid currency codes for conversion: FromCurrency={FromCurrency}, ToCurrency={ToCurrency}", 
                fromCurrency, toCurrency);
            throw new ArgumentException("Currency codes cannot be null or empty");
        }

        // Normalize currency codes
        fromCurrency = fromCurrency.Trim().ToUpperInvariant();
        toCurrency = toCurrency.Trim().ToUpperInvariant();

        if (fromCurrency == toCurrency)
        {
            return new CurrencyConversionResult
            {
                ConvertedAmount = amount,
                ExchangeRate = 1.0m,
                RateTimestamp = DateTime.UtcNow,
                IsStale = false,
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency,
                HasError = false,
                ErrorMessage = null
            };
        }

        try
        {
            var exchangeRate = await GetExchangeRateAsync(fromCurrency, toCurrency);
            var convertedAmount = amount * exchangeRate.Rate;
            
            // Debug logging for currency conversion
            _logger.LogInformation("Currency Conversion Debug: {Amount} {FromCurrency} * {Rate} = {ConvertedAmount} {ToCurrency}", 
                amount, fromCurrency, exchangeRate.Rate, convertedAmount, toCurrency);
            
            return new CurrencyConversionResult
            {
                ConvertedAmount = convertedAmount,
                ExchangeRate = exchangeRate.Rate,
                RateTimestamp = exchangeRate.Timestamp,
                IsStale = DateTime.UtcNow.Subtract(exchangeRate.Timestamp).TotalHours > DatabaseCacheExpirationHours,
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency,
                HasError = false,
                ErrorMessage = null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Currency conversion failed: {Amount} from {FromCurrency} to {ToCurrency}", 
                amount, fromCurrency, toCurrency);
            
            return new CurrencyConversionResult
            {
                ConvertedAmount = amount,
                ExchangeRate = 1.0m,
                RateTimestamp = DateTime.UtcNow,
                IsStale = true,
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency,
                HasError = true,
                ErrorMessage = "Conversion failed - displaying original amount"
            };
        }
    }

    public async Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, string[] targetCurrencies)
    {
        var rates = new Dictionary<string, decimal>();
        
        foreach (var targetCurrency in targetCurrencies)
        {
            if (baseCurrency == targetCurrency)
            {
                rates[targetCurrency] = 1.0m;
                continue;
            }

            try
            {
                var exchangeRate = await GetExchangeRateAsync(baseCurrency, targetCurrency);
                rates[targetCurrency] = exchangeRate.Rate;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get exchange rate from {BaseCurrency} to {TargetCurrency}", 
                    baseCurrency, targetCurrency);
                rates[targetCurrency] = 1.0m; // Fallback
            }
        }

        return rates;
    }

    // Performance optimization: Enhanced batch conversion for dashboard loading
    public async Task<List<CurrencyConversionResult>> BatchConvertAsync(List<BatchConversionRequest> requests)
    {
        if (requests == null || !requests.Any())
        {
            return new List<CurrencyConversionResult>();
        }

        var results = new List<CurrencyConversionResult>();
        
        // Limit batch size for optimal performance
        if (requests.Count > MaxBatchSize)
        {
            _logger.LogWarning("Batch conversion request exceeds maximum size. Limiting to {MaxBatchSize} requests", MaxBatchSize);
            requests = requests.Take(MaxBatchSize).ToList();
        }

        // Group requests by currency pairs to optimize API calls
        var currencyPairs = requests
            .Where(r => r.FromCurrency != r.ToCurrency)
            .GroupBy(r => new { r.FromCurrency, r.ToCurrency })
            .ToList();

        // Performance optimization: Pre-fetch all required exchange rates in optimized batches
        var exchangeRateCache = new Dictionary<string, ExchangeRate>();
        
        foreach (var pairGroup in currencyPairs)
        {
            var cacheKey = $"{pairGroup.Key.FromCurrency}_{pairGroup.Key.ToCurrency}";
            
            try
            {
                var rate = await GetExchangeRateAsync(pairGroup.Key.FromCurrency, pairGroup.Key.ToCurrency);
                exchangeRateCache[cacheKey] = rate;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get exchange rate for batch conversion: {FromCurrency} to {ToCurrency}", 
                    pairGroup.Key.FromCurrency, pairGroup.Key.ToCurrency);
                // Create a fallback rate
                exchangeRateCache[cacheKey] = new ExchangeRate
                {
                    FromCurrency = pairGroup.Key.FromCurrency,
                    ToCurrency = pairGroup.Key.ToCurrency,
                    Rate = 1.0m,
                    Timestamp = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    Source = "fallback"
                };
            }
        }

        // Process all conversion requests using cached rates
        foreach (var request in requests)
        {
            try
            {
                // Validate request
                if (request.Amount < 0)
                {
                    results.Add(CreateErrorResult(request, "Amount cannot be negative"));
                    continue;
                }

                if (string.IsNullOrWhiteSpace(request.FromCurrency) || string.IsNullOrWhiteSpace(request.ToCurrency))
                {
                    results.Add(CreateErrorResult(request, "Currency codes cannot be null or empty"));
                    continue;
                }

                // Normalize currency codes
                var fromCurrency = request.FromCurrency.Trim().ToUpperInvariant();
                var toCurrency = request.ToCurrency.Trim().ToUpperInvariant();

                // Same currency conversion
                if (fromCurrency == toCurrency)
                {
                    results.Add(new CurrencyConversionResult
                    {
                        ConvertedAmount = request.Amount,
                        ExchangeRate = 1.0m,
                        RateTimestamp = DateTime.UtcNow,
                        IsStale = false,
                        FromCurrency = fromCurrency,
                        ToCurrency = toCurrency,
                        HasError = false,
                        ErrorMessage = null
                    });
                    continue;
                }

                // Use cached exchange rate
                var cacheKey = $"{fromCurrency}_{toCurrency}";
                if (exchangeRateCache.TryGetValue(cacheKey, out var exchangeRate))
                {
                    results.Add(new CurrencyConversionResult
                    {
                        ConvertedAmount = request.Amount * exchangeRate.Rate,
                        ExchangeRate = exchangeRate.Rate,
                        RateTimestamp = exchangeRate.Timestamp,
                        IsStale = DateTime.UtcNow.Subtract(exchangeRate.Timestamp).TotalHours > DatabaseCacheExpirationHours,
                        FromCurrency = fromCurrency,
                        ToCurrency = toCurrency,
                        HasError = exchangeRate.Source == "fallback",
                        ErrorMessage = exchangeRate.Source == "fallback" ? "Using fallback rate due to conversion error" : null
                    });
                }
                else
                {
                    results.Add(CreateErrorResult(request, "Exchange rate not available"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing batch conversion request: {Amount} from {FromCurrency} to {ToCurrency}", 
                    request.Amount, request.FromCurrency, request.ToCurrency);
                results.Add(CreateErrorResult(request, "Unexpected error during conversion"));
            }
        }

        return results;
    }

    // Performance optimization: Enhanced batch conversion with advanced optimizations
    public async Task<List<CurrencyConversionResult>> BatchConvertWithOptimizationAsync(List<BatchConversionRequest> requests)
    {
        if (requests == null || !requests.Any())
        {
            return new List<CurrencyConversionResult>();
        }

        // Limit batch size for performance
        if (requests.Count > MaxBatchSize)
        {
            _logger.LogWarning("Batch conversion request exceeds maximum size. Limiting to {MaxBatchSize} requests", MaxBatchSize);
            requests = requests.Take(MaxBatchSize).ToList();
        }

        var results = new List<CurrencyConversionResult>();
        
        // Group requests by currency pairs and validate
        var validRequests = new List<BatchConversionRequest>();
        foreach (var request in requests)
        {
            if (request.Amount < 0 || string.IsNullOrWhiteSpace(request.FromCurrency) || string.IsNullOrWhiteSpace(request.ToCurrency))
            {
                results.Add(CreateErrorResult(request, "Invalid request parameters"));
                continue;
            }
            
            // Normalize currency codes
            request.FromCurrency = request.FromCurrency.Trim().ToUpperInvariant();
            request.ToCurrency = request.ToCurrency.Trim().ToUpperInvariant();
            
            validRequests.Add(request);
        }

        if (!validRequests.Any())
        {
            return results;
        }

        // Group by currency pairs for optimized processing
        var currencyPairGroups = validRequests
            .GroupBy(r => new { r.FromCurrency, r.ToCurrency })
            .ToList();

        // Pre-fetch all unique exchange rates using optimized method
        var uniqueBaseCurrencies = currencyPairGroups
            .Select(g => g.Key.FromCurrency)
            .Distinct()
            .ToList();

        var allExchangeRates = new Dictionary<string, Dictionary<string, decimal>>();
        
        foreach (var baseCurrency in uniqueBaseCurrencies)
        {
            var targetCurrencies = currencyPairGroups
                .Where(g => g.Key.FromCurrency == baseCurrency)
                .Select(g => g.Key.ToCurrency)
                .Where(c => c != baseCurrency)
                .ToHashSet();

            if (targetCurrencies.Any())
            {
                var rates = await GetOptimizedExchangeRatesAsync(baseCurrency, targetCurrencies);
                allExchangeRates[baseCurrency] = rates;
            }
        }

        // Process all requests using pre-fetched rates
        foreach (var request in validRequests)
        {
            try
            {
                // Same currency conversion
                if (request.FromCurrency == request.ToCurrency)
                {
                    results.Add(new CurrencyConversionResult
                    {
                        ConvertedAmount = request.Amount,
                        ExchangeRate = 1.0m,
                        RateTimestamp = DateTime.UtcNow,
                        IsStale = false,
                        FromCurrency = request.FromCurrency,
                        ToCurrency = request.ToCurrency,
                        HasError = false,
                        ErrorMessage = null
                    });
                    continue;
                }

                // Use pre-fetched exchange rate
                if (allExchangeRates.TryGetValue(request.FromCurrency, out var rates) &&
                    rates.TryGetValue(request.ToCurrency, out var rate))
                {
                    results.Add(new CurrencyConversionResult
                    {
                        ConvertedAmount = request.Amount * rate,
                        ExchangeRate = rate,
                        RateTimestamp = DateTime.UtcNow,
                        IsStale = false,
                        FromCurrency = request.FromCurrency,
                        ToCurrency = request.ToCurrency,
                        HasError = false,
                        ErrorMessage = null
                    });
                }
                else
                {
                    results.Add(CreateErrorResult(request, "Exchange rate not available"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing optimized batch conversion request: {Amount} from {FromCurrency} to {ToCurrency}", 
                    request.Amount, request.FromCurrency, request.ToCurrency);
                results.Add(CreateErrorResult(request, "Unexpected error during conversion"));
            }
        }

        return results;
    }

    // Performance optimization: Optimized database queries for exchange rate lookups
    public async Task<Dictionary<string, decimal>> GetOptimizedExchangeRatesAsync(string baseCurrency, HashSet<string> targetCurrencies)
    {
        var rates = new Dictionary<string, decimal>();
        
        // Remove base currency from targets if present
        targetCurrencies.Remove(baseCurrency);
        
        if (!targetCurrencies.Any())
        {
            return rates;
        }

        // Performance optimization: Check memory cache first for all currencies in a single operation
        var cachedRates = new Dictionary<string, decimal>();
        var uncachedCurrencies = new HashSet<string>();
        var cacheKeys = new Dictionary<string, string>();
        
        foreach (var targetCurrency in targetCurrencies)
        {
            var cacheKey = $"exchange_rate_{baseCurrency}_{targetCurrency}";
            cacheKeys[targetCurrency] = cacheKey;
            
            if (_memoryCache.TryGetValue(cacheKey, out ExchangeRate? cachedRate) && cachedRate != null)
            {
                cachedRates[targetCurrency] = cachedRate.Rate;
            }
            else
            {
                uncachedCurrencies.Add(targetCurrency);
            }
        }

        // Performance optimization: Single optimized database query with proper indexing
        if (uncachedCurrencies.Any())
        {
            // Process in batches to avoid large IN clauses that can hurt performance
            var batches = uncachedCurrencies
                .Select((currency, index) => new { currency, index })
                .GroupBy(x => x.index / OptimizedQueryBatchSize)
                .Select(g => g.Select(x => x.currency).ToList())
                .ToList();

            foreach (var batch in batches)
            {
                // Use the optimized index IX_ExchangeRate_Currencies_Expiry for better performance
                var dbRates = await _context.Set<ExchangeRate>()
                    .Where(r => r.FromCurrency == baseCurrency && 
                               batch.Contains(r.ToCurrency) && 
                               r.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(r => r.Timestamp) // Get most recent rates first
                    .ToListAsync();

                // Performance optimization: Batch memory cache operations
                var memoryBatchOperations = new List<(string key, ExchangeRate rate)>();
                
                foreach (var dbRate in dbRates)
                {
                    cachedRates[dbRate.ToCurrency] = dbRate.Rate;
                    uncachedCurrencies.Remove(dbRate.ToCurrency);
                    
                    // Prepare batch memory cache operation
                    memoryBatchOperations.Add((cacheKeys[dbRate.ToCurrency], dbRate));
                }
                
                // Execute batch memory cache operations
                foreach (var (key, rate) in memoryBatchOperations)
                {
                    _memoryCache.Set(key, rate, TimeSpan.FromHours(CacheExpirationHours));
                }
            }
        }

        // Performance optimization: Fetch remaining rates from external API in a single call
        if (uncachedCurrencies.Any())
        {
            try
            {
                var apiResponse = await _exchangeRateProvider.GetRatesAsync(baseCurrency);
                
                if (apiResponse.Success)
                {
                    var ratesToSave = new List<ExchangeRate>();
                    var memoryBatchOperations = new List<(string key, ExchangeRate rate)>();
                    
                    foreach (var targetCurrency in uncachedCurrencies)
                    {
                        if (apiResponse.Rates.TryGetValue(targetCurrency, out var rate))
                        {
                            cachedRates[targetCurrency] = rate;
                            
                            var exchangeRate = new ExchangeRate
                            {
                                FromCurrency = baseCurrency,
                                ToCurrency = targetCurrency,
                                Rate = rate,
                                Timestamp = apiResponse.Timestamp,
                                ExpiresAt = DateTime.UtcNow.AddHours(DatabaseCacheExpirationHours),
                                Source = "exchangerate-api"
                            };
                            
                            ratesToSave.Add(exchangeRate);
                            memoryBatchOperations.Add((cacheKeys[targetCurrency], exchangeRate));
                        }
                        else
                        {
                            _logger.LogWarning("Exchange rate not available for {BaseCurrency} to {TargetCurrency}", 
                                baseCurrency, targetCurrency);
                            cachedRates[targetCurrency] = 1.0m; // Fallback
                        }
                    }
                    
                    // Performance optimization: Batch database save with single transaction
                    if (ratesToSave.Any())
                    {
                        using var transaction = await _context.Database.BeginTransactionAsync();
                        try
                        {
                            _context.Set<ExchangeRate>().AddRange(ratesToSave);
                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();
                            
                            // Execute batch memory cache operations after successful DB save
                            foreach (var (key, rate) in memoryBatchOperations)
                            {
                                _memoryCache.Set(key, rate, TimeSpan.FromHours(CacheExpirationHours));
                            }
                        }
                        catch
                        {
                            await transaction.RollbackAsync();
                            throw;
                        }
                    }
                }
                else
                {
                    _logger.LogError("Failed to fetch exchange rates from API for base currency {BaseCurrency}", baseCurrency);
                    // Use fallback rates
                    foreach (var targetCurrency in uncachedCurrencies)
                    {
                        cachedRates[targetCurrency] = 1.0m;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching optimized exchange rates for {BaseCurrency}", baseCurrency);
                // Use fallback rates
                foreach (var targetCurrency in uncachedCurrencies)
                {
                    cachedRates[targetCurrency] = 1.0m;
                }
            }
        }

        // Add base currency rate
        rates[baseCurrency] = 1.0m;
        
        // Add all cached rates
        foreach (var kvp in cachedRates)
        {
            rates[kvp.Key] = kvp.Value;
        }

        return rates;
    }

    // Performance optimization: Cache warming for common currency pairs
    public async Task WarmCacheForCommonCurrencyPairsAsync(string baseCurrency)
    {
        try
        {
            _logger.LogInformation("Starting cache warming for common currency pairs with base currency {BaseCurrency}", baseCurrency);
            
            var targetCurrencies = CommonCurrencies.Where(c => c != baseCurrency).ToHashSet();
            
            if (!targetCurrencies.Any())
            {
                return;
            }

            // Check which currencies are not already cached
            var uncachedCurrencies = new HashSet<string>();
            foreach (var targetCurrency in targetCurrencies)
            {
                var cacheKey = $"exchange_rate_{baseCurrency}_{targetCurrency}";
                if (!_memoryCache.TryGetValue(cacheKey, out ExchangeRate? cachedRate) || cachedRate == null)
                {
                    // Check database cache using optimized query
                    var dbRate = await _context.Set<ExchangeRate>()
                        .Where(r => r.FromCurrency == baseCurrency && 
                                   r.ToCurrency == targetCurrency && 
                                   r.ExpiresAt > DateTime.UtcNow)
                        .OrderByDescending(r => r.Timestamp)
                        .FirstOrDefaultAsync();
                    
                    if (dbRate == null)
                    {
                        uncachedCurrencies.Add(targetCurrency);
                    }
                    else
                    {
                        // Cache in memory
                        _memoryCache.Set(cacheKey, dbRate, TimeSpan.FromHours(CacheExpirationHours));
                    }
                }
            }

            // Fetch uncached rates in optimized batches
            if (uncachedCurrencies.Any())
            {
                var batches = uncachedCurrencies
                    .Select((currency, index) => new { currency, index })
                    .GroupBy(x => x.index / CacheWarmingBatchSize)
                    .Select(g => g.Select(x => x.currency).ToList())
                    .ToList();

                foreach (var batch in batches)
                {
                    try
                    {
                        var rates = await GetOptimizedExchangeRatesAsync(baseCurrency, batch.ToHashSet());
                        _logger.LogInformation("Warmed cache for {Count} currency pairs with base {BaseCurrency}", 
                            rates.Count, baseCurrency);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to warm cache for batch of currencies: {Currencies}", 
                            string.Join(", ", batch));
                    }
                }
            }
            
            _logger.LogInformation("Cache warming completed for {BaseCurrency}. Processed {Count} currency pairs", 
                baseCurrency, targetCurrencies.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cache warming for {BaseCurrency}", baseCurrency);
        }
    }

    // Performance optimization: Get frequently used currency pairs for enhanced caching
    public async Task<Dictionary<string, decimal>> GetFrequentlyUsedRatesAsync(string baseCurrency)
    {
        try
        {
            // Get the most frequently requested currency pairs from database using optimized query
            var frequentPairs = await _context.Set<ExchangeRate>()
                .Where(r => r.FromCurrency == baseCurrency && r.ExpiresAt > DateTime.UtcNow)
                .GroupBy(r => r.ToCurrency)
                .Select(g => new { 
                    Currency = g.Key, 
                    Count = g.Count(),
                    LatestRate = g.OrderByDescending(r => r.Timestamp).First().Rate
                })
                .OrderByDescending(x => x.Count)
                .Take(15) // Get top 15 most frequent pairs for better caching
                .ToListAsync();

            var rates = new Dictionary<string, decimal>();
            
            foreach (var pair in frequentPairs)
            {
                rates[pair.Currency] = pair.LatestRate;
            }

            return rates;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting frequently used rates for {BaseCurrency}", baseCurrency);
            return new Dictionary<string, decimal>();
        }
    }

    // Performance optimization: Enhanced cache cleanup
    public async Task CleanupExpiredCacheEntriesAsync()
    {
        try
        {
            _logger.LogInformation("Starting cleanup of expired exchange rate cache entries");
            
            // Use optimized query with index for expired entries
            var expiredEntries = await _context.Set<ExchangeRate>()
                .Where(r => r.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync();

            if (expiredEntries.Any())
            {
                // Process in batches for better performance
                var batches = expiredEntries
                    .Select((entry, index) => new { entry, index })
                    .GroupBy(x => x.index / OptimizedQueryBatchSize)
                    .Select(g => g.Select(x => x.entry).ToList())
                    .ToList();

                var totalDeleted = 0;
                foreach (var batch in batches)
                {
                    _context.Set<ExchangeRate>().RemoveRange(batch);
                    var deletedCount = await _context.SaveChangesAsync();
                    totalDeleted += deletedCount;
                }
                
                _logger.LogInformation("Cleaned up {Count} expired exchange rate entries", totalDeleted);
            }
            else
            {
                _logger.LogInformation("No expired exchange rate entries found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cache cleanup");
        }
    }

    // Performance optimization: Enhanced currency pair preloading
    public async Task PreloadCurrencyPairsAsync(List<(string from, string to)> currencyPairs)
    {
        try
        {
            _logger.LogInformation("Preloading {Count} currency pairs for performance optimization", currencyPairs.Count);
            
            var uniquePairs = currencyPairs
                .Where(pair => pair.from != pair.to)
                .Distinct()
                .ToList();

            if (!uniquePairs.Any()) return;

            // Group by base currency for efficient API calls
            var groupedPairs = uniquePairs
                .GroupBy(pair => pair.from)
                .ToList();

            // Process groups in parallel with controlled concurrency
            var semaphore = new SemaphoreSlim(3, 3); // Limit to 3 concurrent operations
            var tasks = groupedPairs.Select(async group =>
            {
                await semaphore.WaitAsync();
                try
                {
                    var baseCurrency = group.Key;
                    var targetCurrencies = group.Select(pair => pair.to).ToHashSet();
                    
                    // Use optimized exchange rate fetching
                    var rates = await GetOptimizedExchangeRatesAsync(baseCurrency, targetCurrencies);
                    _logger.LogInformation("Preloaded {Count} currency rates for base currency {BaseCurrency}", 
                        rates.Count, baseCurrency);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to preload rates for base currency {BaseCurrency}", group.Key);
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(tasks);
            
            _logger.LogInformation("Completed preloading currency pairs");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during currency pair preloading");
        }
    }

    private CurrencyConversionResult CreateErrorResult(BatchConversionRequest request, string errorMessage)
    {
        return new CurrencyConversionResult
        {
            ConvertedAmount = request.Amount,
            ExchangeRate = 1.0m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = true,
            FromCurrency = request.FromCurrency,
            ToCurrency = request.ToCurrency,
            HasError = true,
            ErrorMessage = errorMessage
        };
    }

    private async Task<ExchangeRate> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        // Check memory cache first
        var cacheKey = $"exchange_rate_{fromCurrency}_{toCurrency}";
        if (_memoryCache.TryGetValue(cacheKey, out ExchangeRate? cachedRate) && cachedRate != null)
        {
            return cachedRate;
        }

        // Check database cache using optimized index
        var dbRate = await _context.Set<ExchangeRate>()
            .Where(r => r.FromCurrency == fromCurrency && 
                       r.ToCurrency == toCurrency && 
                       r.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(r => r.Timestamp)
            .FirstOrDefaultAsync();

        if (dbRate != null)
        {
            // Cache in memory
            _memoryCache.Set(cacheKey, dbRate, TimeSpan.FromHours(CacheExpirationHours));
            return dbRate;
        }

        // Fetch from external API
        var apiResponse = await _exchangeRateProvider.GetRatesAsync(fromCurrency);
        
        if (!apiResponse.Success || !apiResponse.Rates.TryGetValue(toCurrency, out var rate))
        {
            _logger.LogError("Failed to get exchange rate from API: {FromCurrency} to {ToCurrency}. API Success: {Success}", 
                fromCurrency, toCurrency, apiResponse.Success);
            throw new InvalidOperationException($"Unable to get exchange rate from {fromCurrency} to {toCurrency}");
        }

        _logger.LogInformation("Fetched exchange rate from API: {FromCurrency} to {ToCurrency} = {Rate}", 
            fromCurrency, toCurrency, rate);

        var exchangeRate = new ExchangeRate
        {
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency,
            Rate = rate,
            Timestamp = apiResponse.Timestamp,
            ExpiresAt = DateTime.UtcNow.AddHours(DatabaseCacheExpirationHours),
            Source = "exchangerate-api"
        };

        // Save to database and cache in memory
        _context.Set<ExchangeRate>().Add(exchangeRate);
        await _context.SaveChangesAsync();
        
        _memoryCache.Set(cacheKey, exchangeRate, TimeSpan.FromHours(CacheExpirationHours));

        return exchangeRate;
    }
}
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
        if (fromCurrency == toCurrency)
        {
            return new CurrencyConversionResult
            {
                ConvertedAmount = amount,
                ExchangeRate = 1.0m,
                RateTimestamp = DateTime.UtcNow,
                IsStale = false,
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency
            };
        }

        try
        {
            var exchangeRate = await GetExchangeRateAsync(fromCurrency, toCurrency);
            
            return new CurrencyConversionResult
            {
                ConvertedAmount = amount * exchangeRate.Rate,
                ExchangeRate = exchangeRate.Rate,
                RateTimestamp = exchangeRate.Timestamp,
                IsStale = DateTime.UtcNow.Subtract(exchangeRate.Timestamp).TotalHours > DatabaseCacheExpirationHours,
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to convert {Amount} from {FromCurrency} to {ToCurrency}", 
                amount, fromCurrency, toCurrency);
            
            // Return original amount as fallback
            return new CurrencyConversionResult
            {
                ConvertedAmount = amount,
                ExchangeRate = 1.0m,
                RateTimestamp = DateTime.UtcNow,
                IsStale = true,
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency
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

    private async Task<ExchangeRate> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        var cacheKey = $"exchange_rate_{fromCurrency}_{toCurrency}";
        
        // Try memory cache first
        if (_memoryCache.TryGetValue(cacheKey, out ExchangeRate? cachedRate) && cachedRate != null)
        {
            return cachedRate;
        }

        // Try database cache
        var dbRate = await _context.Set<ExchangeRate>()
            .FirstOrDefaultAsync(r => r.FromCurrency == fromCurrency && 
                                    r.ToCurrency == toCurrency && 
                                    r.ExpiresAt > DateTime.UtcNow);

        if (dbRate != null)
        {
            // Cache in memory for faster access
            _memoryCache.Set(cacheKey, dbRate, TimeSpan.FromHours(CacheExpirationHours));
            return dbRate;
        }

        // Fetch from external API
        var apiResponse = await _exchangeRateProvider.GetRatesAsync(fromCurrency);
        
        if (!apiResponse.Success || !apiResponse.Rates.ContainsKey(toCurrency))
        {
            throw new InvalidOperationException($"Unable to get exchange rate from {fromCurrency} to {toCurrency}");
        }

        var rate = apiResponse.Rates[toCurrency];
        var exchangeRate = new ExchangeRate
        {
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency,
            Rate = rate,
            Timestamp = apiResponse.Timestamp,
            ExpiresAt = DateTime.UtcNow.AddHours(DatabaseCacheExpirationHours),
            Source = "exchangerate-api"
        };

        // Save to database
        _context.Set<ExchangeRate>().Add(exchangeRate);
        await _context.SaveChangesAsync();

        // Cache in memory
        _memoryCache.Set(cacheKey, exchangeRate, TimeSpan.FromHours(CacheExpirationHours));

        return exchangeRate;
    }
}
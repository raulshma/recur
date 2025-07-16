using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.Models;

namespace RecurApi.Services;

public class ExchangeRateApiProvider : IExchangeRateProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExchangeRateApiProvider> _logger;
    private readonly IMemoryCache _memoryCache;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _apiKey;
    private readonly string _baseUrl = "https://v6.exchangerate-api.com/v6";
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromHours(1);

    public ExchangeRateApiProvider(
        HttpClient httpClient, 
        ILogger<ExchangeRateApiProvider> logger, 
        IConfiguration configuration,
        IMemoryCache memoryCache,
        IServiceProvider serviceProvider)
    {
        _httpClient = httpClient;
        _logger = logger;
        _memoryCache = memoryCache;
        _serviceProvider = serviceProvider;
        _apiKey = configuration["ExchangeRateApi:ApiKey"] ?? "demo"; // Use demo for development
    }

    public async Task<ExchangeRateResponse> GetRatesAsync(string baseCurrency)
    {
        try
        {
            var url = $"{_baseUrl}/{_apiKey}/latest/{baseCurrency}";
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to fetch exchange rates. Status: {StatusCode}", response.StatusCode);
                return new ExchangeRateResponse { Success = false };
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ExchangeRateApiResponse>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (apiResponse?.Result != "success")
            {
                _logger.LogError("Exchange rate API returned error: {Error}", apiResponse?.ErrorType);
                return new ExchangeRateResponse { Success = false };
            }

            return new ExchangeRateResponse
            {
                BaseCurrency = baseCurrency,
                Rates = apiResponse.ConversionRates ?? new Dictionary<string, decimal>(),
                Timestamp = DateTime.UtcNow,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while fetching exchange rates for {BaseCurrency}", baseCurrency);
            return new ExchangeRateResponse { Success = false };
        }
    }

    public async Task<decimal?> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return 1.0m;

        var cacheKey = $"exchange_rate_{fromCurrency}_{toCurrency}";
        
        // Check memory cache first
        if (_memoryCache.TryGetValue(cacheKey, out decimal cachedRate))
        {
            return cachedRate;
        }

        // Check database cache
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<RecurDbContext>();
        
        var dbRate = await dbContext.ExchangeRates
            .Where(er => er.FromCurrency == fromCurrency && 
                        er.ToCurrency == toCurrency && 
                        er.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(er => er.Timestamp)
            .FirstOrDefaultAsync();

        if (dbRate != null)
        {
            // Cache in memory for faster access
            _memoryCache.Set(cacheKey, dbRate.Rate, TimeSpan.FromMinutes(30));
            return dbRate.Rate;
        }

        // Fetch from API and cache
        var rate = await FetchAndCacheRateAsync(fromCurrency, toCurrency);
        if (rate.HasValue)
        {
            _memoryCache.Set(cacheKey, rate.Value, TimeSpan.FromMinutes(30));
        }

        return rate;
    }

    private async Task<decimal?> FetchAndCacheRateAsync(string fromCurrency, string toCurrency)
    {
        try
        {
            var ratesResponse = await GetRatesAsync(fromCurrency);
            if (!ratesResponse.Success || !ratesResponse.Rates.ContainsKey(toCurrency))
            {
                return null;
            }

            var rate = ratesResponse.Rates[toCurrency];
            
            // Store in database
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<RecurDbContext>();
            
            var exchangeRate = new ExchangeRate
            {
                FromCurrency = fromCurrency,
                ToCurrency = toCurrency,
                Rate = rate,
                Timestamp = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.Add(_cacheExpiry),
                Source = "exchangerate-api"
            };

            dbContext.ExchangeRates.Add(exchangeRate);
            await dbContext.SaveChangesAsync();

            return rate;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch and cache exchange rate from {FromCurrency} to {ToCurrency}", fromCurrency, toCurrency);
            return null;
        }
    }

    private class ExchangeRateApiResponse
    {
        public string Result { get; set; } = string.Empty;
        public string? ErrorType { get; set; }
        public Dictionary<string, decimal>? ConversionRates { get; set; }
    }
}
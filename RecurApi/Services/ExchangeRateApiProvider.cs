using System.Text.Json;
using System.Text.Json.Serialization;
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
    private readonly TimeSpan _cacheExpiry;

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
        _cacheExpiry = TimeSpan.FromMinutes(configuration["ExchangeRateApi:CacheExpiryMinutes"] ?? 720);
    }

    public async Task<ExchangeRateResponse> GetRatesAsync(string baseCurrency)
    {
        try
        {
            var url = $"{_baseUrl}/{_apiKey}/latest/{baseCurrency}";
            _logger.LogInformation("Fetching exchange rates from {Url}", url.Replace(_apiKey, "[API_KEY]"));
            
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to fetch exchange rates. Status: {StatusCode}", response.StatusCode);
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error response content: {ErrorContent}", errorContent);
                return new ExchangeRateResponse { Success = false };
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("API Response: {Response}", jsonContent);
            
            var apiResponse = JsonSerializer.Deserialize<ExchangeRateApiResponse>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (apiResponse?.Result != "success")
            {
                _logger.LogError("Exchange rate API returned error: {Error}", apiResponse?.ErrorType);
                return new ExchangeRateResponse { Success = false };
            }

            if (apiResponse.ConversionRates == null || !apiResponse.ConversionRates.Any())
            {
                _logger.LogWarning("Exchange rate API returned empty conversion rates for {BaseCurrency}", baseCurrency);
                return new ExchangeRateResponse { Success = false };
            }

            _logger.LogInformation("Successfully fetched exchange rates for {BaseCurrency}. Found {Count} currencies.", 
                baseCurrency, apiResponse.ConversionRates.Count);

            return new ExchangeRateResponse
            {
                BaseCurrency = baseCurrency,
                Rates = apiResponse.ConversionRates,
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
            _logger.LogInformation("Using cached exchange rate for {FromCurrency} to {ToCurrency}: {Rate}", 
                fromCurrency, toCurrency, cachedRate);
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
            _logger.LogInformation("Using database cached exchange rate for {FromCurrency} to {ToCurrency}: {Rate}", 
                fromCurrency, toCurrency, dbRate.Rate);
            _memoryCache.Set(cacheKey, dbRate.Rate, TimeSpan.FromMinutes(30));
            return dbRate.Rate;
        }

        // Try reverse conversion if available (e.g., if INR to USD exists, calculate 1/rate for USD to INR)
        var reverseCacheKey = $"exchange_rate_{toCurrency}_{fromCurrency}";
        if (_memoryCache.TryGetValue(reverseCacheKey, out decimal reverseRate) && reverseRate != 0)
        {
            var calculatedRate = 1 / reverseRate;
            _logger.LogInformation("Calculated reverse exchange rate for {FromCurrency} to {ToCurrency}: {Rate}", 
                fromCurrency, toCurrency, calculatedRate);
            _memoryCache.Set(cacheKey, calculatedRate, TimeSpan.FromMinutes(30));
            return calculatedRate;
        }

        // Check for reverse rate in database
        var reverseDbRate = await dbContext.ExchangeRates
            .Where(er => er.FromCurrency == toCurrency && 
                        er.ToCurrency == fromCurrency && 
                        er.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(er => er.Timestamp)
            .FirstOrDefaultAsync();

        if (reverseDbRate != null && reverseDbRate.Rate != 0)
        {
            var calculatedRate = 1 / reverseDbRate.Rate;
            _logger.LogInformation("Calculated reverse exchange rate from database for {FromCurrency} to {ToCurrency}: {Rate}", 
                fromCurrency, toCurrency, calculatedRate);
            _memoryCache.Set(cacheKey, calculatedRate, TimeSpan.FromMinutes(30));
            return calculatedRate;
        }

        // Fetch from API and cache
        _logger.LogInformation("Fetching exchange rate from API for {FromCurrency} to {ToCurrency}", 
            fromCurrency, toCurrency);
        var rate = await FetchAndCacheRateAsync(fromCurrency, toCurrency);
        if (rate.HasValue)
        {
            _memoryCache.Set(cacheKey, rate.Value, TimeSpan.FromMinutes(30));
            _logger.LogInformation("Successfully fetched and cached exchange rate for {FromCurrency} to {ToCurrency}: {Rate}", 
                fromCurrency, toCurrency, rate.Value);
        }
        else
        {
            _logger.LogWarning("Exchange rate not available for {FromCurrency} to {ToCurrency}", 
                fromCurrency, toCurrency);
        }

        return rate;
    }

    private async Task<decimal?> FetchAndCacheRateAsync(string fromCurrency, string toCurrency)
    {
        try
        {
            var ratesResponse = await GetRatesAsync(fromCurrency);
            if (!ratesResponse.Success)
            {
                _logger.LogError("API returned unsuccessful response for {FromCurrency}", fromCurrency);
                return null;
            }

            if (!ratesResponse.Rates.ContainsKey(toCurrency))
            {
                _logger.LogWarning("Currency {ToCurrency} not found in exchange rate response for base {FromCurrency}", 
                    toCurrency, fromCurrency);
                
                // Try fetching the reverse rate and calculating the inverse
                var reverseResponse = await GetRatesAsync(toCurrency);
                if (reverseResponse.Success && reverseResponse.Rates.ContainsKey(fromCurrency))
                {
                    var reverseRate = reverseResponse.Rates[fromCurrency];
                    if (reverseRate > 0)
                    {
                        var calculatedRate = 1 / reverseRate;
                        _logger.LogInformation("Calculated rate for {FromCurrency} to {ToCurrency} using reverse lookup: {Rate}", 
                            fromCurrency, toCurrency, calculatedRate);
                        
                        // Store calculated rate in database
                        await StoreRateInDatabase(fromCurrency, toCurrency, calculatedRate);
                        
                        return calculatedRate;
                    }
                }
                
                return null;
            }

            var rate = ratesResponse.Rates[toCurrency];
            
            // Store in database
            await StoreRateInDatabase(fromCurrency, toCurrency, rate);

            return rate;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch and cache exchange rate from {FromCurrency} to {ToCurrency}", fromCurrency, toCurrency);
            return null;
        }
    }
    
    private async Task StoreRateInDatabase(string fromCurrency, string toCurrency, decimal rate)
    {
        try
        {
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
            
            _logger.LogInformation("Stored exchange rate in database: {FromCurrency} to {ToCurrency} = {Rate}", 
                fromCurrency, toCurrency, rate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store exchange rate in database for {FromCurrency} to {ToCurrency}", 
                fromCurrency, toCurrency);
        }
    }

    private class ExchangeRateApiResponse
    {
        [JsonPropertyName("result")]
        public string Result { get; set; } = string.Empty;
        
        [JsonPropertyName("error-type")]
        public string? ErrorType { get; set; }
        
        [JsonPropertyName("conversion_rates")]
        public Dictionary<string, decimal>? ConversionRates { get; set; }
    }
}
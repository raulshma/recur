using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using RecurApi.Data;
using RecurApi.Models;
using RecurApi.Services;
using Xunit;

namespace RecurApi.Tests;

public class CurrencyConversionServiceTests : IDisposable
{
    private readonly RecurDbContext _context;
    private readonly Mock<IExchangeRateProvider> _mockExchangeRateProvider;
    private readonly Mock<ILogger<CurrencyConversionService>> _mockLogger;
    private readonly IMemoryCache _memoryCache;
    private readonly CurrencyConversionService _service;

    public CurrencyConversionServiceTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<RecurDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new RecurDbContext(options);
        _mockExchangeRateProvider = new Mock<IExchangeRateProvider>();
        _mockLogger = new Mock<ILogger<CurrencyConversionService>>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        
        _service = new CurrencyConversionService(
            _mockExchangeRateProvider.Object,
            _context,
            _memoryCache,
            _mockLogger.Object);
    }

    [Fact]
    public async Task ConvertAsync_SameCurrency_ReturnsOriginalAmount()
    {
        // Arrange
        var amount = 100m;
        var currency = "USD";

        // Act
        var result = await _service.ConvertAsync(amount, currency, currency);

        // Assert
        Assert.Equal(amount, result);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_ValidConversion_PersistsToDatabase()
    {
        // Arrange
        var amount = 100m;
        var fromCurrency = "USD";
        var toCurrency = "EUR";
        var exchangeRate = 0.85m;

        var mockResponse = new ExchangeRateResponse
        {
            BaseCurrency = fromCurrency,
            Rates = new Dictionary<string, decimal> { { toCurrency, exchangeRate } },
            Timestamp = DateTime.UtcNow,
            Success = true
        };

        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync(fromCurrency))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _service.ConvertWithMetadataAsync(amount, fromCurrency, toCurrency);

        // Assert
        Assert.Equal(amount * exchangeRate, result.ConvertedAmount);
        Assert.Equal(exchangeRate, result.ExchangeRate);
        Assert.Equal(fromCurrency, result.FromCurrency);
        Assert.Equal(toCurrency, result.ToCurrency);
        Assert.False(result.HasError);

        // Verify database persistence
        var savedRate = await _context.ExchangeRates
            .FirstOrDefaultAsync(r => r.FromCurrency == fromCurrency && r.ToCurrency == toCurrency);
        
        Assert.NotNull(savedRate);
        Assert.Equal(exchangeRate, savedRate.Rate);
        Assert.Equal("exchangerate-api", savedRate.Source);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_ApiFailure_ReturnsErrorResult()
    {
        // Arrange
        var amount = 100m;
        var fromCurrency = "USD";
        var toCurrency = "EUR";

        var mockResponse = new ExchangeRateResponse
        {
            Success = false
        };

        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync(fromCurrency))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _service.ConvertWithMetadataAsync(amount, fromCurrency, toCurrency);

        // Assert
        Assert.Equal(amount, result.ConvertedAmount); // Should return original amount
        Assert.True(result.HasError);
        Assert.Contains("Conversion failed", result.ErrorMessage);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_UsesCachedRate_WhenAvailable()
    {
        // Arrange
        var amount = 100m;
        var fromCurrency = "USD";
        var toCurrency = "EUR";
        var exchangeRate = 0.85m;

        // Pre-populate database with cached rate
        var cachedRate = new ExchangeRate
        {
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency,
            Rate = exchangeRate,
            Timestamp = DateTime.UtcNow.AddMinutes(-30),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            Source = "exchangerate-api"
        };

        _context.ExchangeRates.Add(cachedRate);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ConvertWithMetadataAsync(amount, fromCurrency, toCurrency);

        // Assert
        Assert.Equal(amount * exchangeRate, result.ConvertedAmount);
        Assert.Equal(exchangeRate, result.ExchangeRate);
        
        // Verify API was not called since we used cached rate
        _mockExchangeRateProvider.Verify(x => x.GetRatesAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task BatchConvertAsync_ValidRequests_ReturnsCorrectResults()
    {
        // Arrange
        var requests = new List<BatchConversionRequest>
        {
            new() { Amount = 100m, FromCurrency = "USD", ToCurrency = "EUR" },
            new() { Amount = 200m, FromCurrency = "USD", ToCurrency = "GBP" }
        };

        var mockResponse = new ExchangeRateResponse
        {
            BaseCurrency = "USD",
            Rates = new Dictionary<string, decimal> 
            { 
                { "EUR", 0.85m },
                { "GBP", 0.75m }
            },
            Timestamp = DateTime.UtcNow,
            Success = true
        };

        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ReturnsAsync(mockResponse);

        // Act
        var results = await _service.BatchConvertAsync(requests);

        // Assert
        Assert.Equal(2, results.Count);
        
        var eurResult = results.First(r => r.ToCurrency == "EUR");
        Assert.Equal(85m, eurResult.ConvertedAmount);
        
        var gbpResult = results.First(r => r.ToCurrency == "GBP");
        Assert.Equal(150m, gbpResult.ConvertedAmount);

        // Verify both rates were persisted to database
        var savedRates = await _context.ExchangeRates.ToListAsync();
        Assert.Equal(2, savedRates.Count);
    }

    [Theory]
    [InlineData(-100, "USD", "EUR")]
    [InlineData(100, "", "EUR")]
    [InlineData(100, "USD", "")]
    [InlineData(100, null, "EUR")]
    [InlineData(100, "USD", null)]
    public async Task ConvertWithMetadataAsync_InvalidInput_ThrowsArgumentException(
        decimal amount, string fromCurrency, string toCurrency)
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.ConvertWithMetadataAsync(amount, fromCurrency, toCurrency));
    }

    [Fact]
    public async Task GetOptimizedExchangeRatesAsync_CachesRatesInMemoryAndDatabase()
    {
        // Arrange
        var baseCurrency = "USD";
        var targetCurrencies = new HashSet<string> { "EUR", "GBP" };

        var mockResponse = new ExchangeRateResponse
        {
            BaseCurrency = baseCurrency,
            Rates = new Dictionary<string, decimal> 
            { 
                { "EUR", 0.85m },
                { "GBP", 0.75m }
            },
            Timestamp = DateTime.UtcNow,
            Success = true
        };

        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync(baseCurrency))
            .ReturnsAsync(mockResponse);

        // Act
        var rates = await _service.GetOptimizedExchangeRatesAsync(baseCurrency, targetCurrencies);

        // Assert
        Assert.Equal(3, rates.Count); // USD, EUR, GBP
        Assert.Equal(1.0m, rates["USD"]);
        Assert.Equal(0.85m, rates["EUR"]);
        Assert.Equal(0.75m, rates["GBP"]);

        // Verify database persistence
        var savedRates = await _context.ExchangeRates.ToListAsync();
        Assert.Equal(2, savedRates.Count);

        // Verify memory cache
        var eurCacheKey = "exchange_rate_USD_EUR";
        var gbpCacheKey = "exchange_rate_USD_GBP";
        
        Assert.True(_memoryCache.TryGetValue(eurCacheKey, out ExchangeRate? eurCached));
        Assert.True(_memoryCache.TryGetValue(gbpCacheKey, out ExchangeRate? gbpCached));
        
        Assert.Equal(0.85m, eurCached?.Rate);
        Assert.Equal(0.75m, gbpCached?.Rate);
    }

    [Fact]
    public async Task CleanupExpiredCacheEntriesAsync_RemovesExpiredEntries()
    {
        // Arrange
        var expiredRate = new ExchangeRate
        {
            FromCurrency = "USD",
            ToCurrency = "EUR",
            Rate = 0.85m,
            Timestamp = DateTime.UtcNow.AddDays(-2),
            ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired
            Source = "exchangerate-api"
        };

        var validRate = new ExchangeRate
        {
            FromCurrency = "USD",
            ToCurrency = "GBP",
            Rate = 0.75m,
            Timestamp = DateTime.UtcNow.AddMinutes(-30),
            ExpiresAt = DateTime.UtcNow.AddHours(1), // Still valid
            Source = "exchangerate-api"
        };

        _context.ExchangeRates.AddRange(expiredRate, validRate);
        await _context.SaveChangesAsync();

        // Act
        await _service.CleanupExpiredCacheEntriesAsync();

        // Assert
        var remainingRates = await _context.ExchangeRates.ToListAsync();
        Assert.Single(remainingRates);
        Assert.Equal("GBP", remainingRates.First().ToCurrency);
    }

    public void Dispose()
    {
        _context.Dispose();
        _memoryCache.Dispose();
    }
}
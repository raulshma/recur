using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using RecurApi.Data;
using RecurApi.Models;
using RecurApi.Services;
using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace RecurApi.Tests;

public class ExchangeRateApiProviderTests : IDisposable
{
    private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
    private readonly HttpClient _httpClient;
    private readonly Mock<ILogger<ExchangeRateApiProvider>> _mockLogger;
    private readonly IMemoryCache _memoryCache;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ExchangeRateApiProvider _provider;
    private readonly RecurDbContext _context;

    public ExchangeRateApiProviderTests()
    {
        // Setup HttpClient with mock handler
        _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        _httpClient = new HttpClient(_mockHttpMessageHandler.Object);
        
        _mockLogger = new Mock<ILogger<ExchangeRateApiProvider>>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        
        // Setup configuration
        var configurationData = new Dictionary<string, string>
        {
            {"ExchangeRateApi:ApiKey", "test-api-key"}
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData!)
            .Build();

        // Setup in-memory database
        var options = new DbContextOptionsBuilder<RecurDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new RecurDbContext(options);

        // Setup service provider
        var services = new ServiceCollection();
        services.AddSingleton(_context);
        _serviceProvider = services.BuildServiceProvider();

        _provider = new ExchangeRateApiProvider(
            _httpClient,
            _mockLogger.Object,
            _configuration,
            _memoryCache,
            _serviceProvider);
    }

    [Fact]
    public async Task GetRatesAsync_SuccessfulApiCall_ReturnsValidResponse()
    {
        // Arrange
        var baseCurrency = "USD";
        var apiResponse = new
        {
            result = "success",
            conversion_rates = new Dictionary<string, decimal>
            {
                { "EUR", 0.85m },
                { "GBP", 0.75m },
                { "JPY", 110.0m }
            }
        };

        var jsonResponse = JsonSerializer.Serialize(apiResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
        };

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(httpResponse);

        // Act
        var result = await _provider.GetRatesAsync(baseCurrency);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(baseCurrency, result.BaseCurrency);
        Assert.Equal(3, result.Rates.Count);
        Assert.Equal(0.85m, result.Rates["EUR"]);
        Assert.Equal(0.75m, result.Rates["GBP"]);
        Assert.Equal(110.0m, result.Rates["JPY"]);
    }

    [Fact]
    public async Task GetRatesAsync_ApiReturnsError_ReturnsFailureResponse()
    {
        // Arrange
        var baseCurrency = "USD";
        var apiResponse = new
        {
            result = "error",
            error_type = "invalid-key"
        };

        var jsonResponse = JsonSerializer.Serialize(apiResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
        };

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(httpResponse);

        // Act
        var result = await _provider.GetRatesAsync(baseCurrency);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task GetRatesAsync_HttpRequestFails_ReturnsFailureResponse()
    {
        // Arrange
        var baseCurrency = "USD";
        var httpResponse = new HttpResponseMessage(HttpStatusCode.InternalServerError);

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(httpResponse);

        // Act
        var result = await _provider.GetRatesAsync(baseCurrency);

        // Assert
        Assert.False(result.Success);
    }

    [Fact]
    public async Task GetExchangeRateAsync_SameCurrency_ReturnsOne()
    {
        // Arrange
        var currency = "USD";

        // Act
        var result = await _provider.GetExchangeRateAsync(currency, currency);

        // Assert
        Assert.Equal(1.0m, result);
    }

    [Fact]
    public async Task GetExchangeRateAsync_CachedInMemory_ReturnsCachedValue()
    {
        // Arrange
        var fromCurrency = "USD";
        var toCurrency = "EUR";
        var cachedRate = 0.85m;
        var cacheKey = $"exchange_rate_{fromCurrency}_{toCurrency}";

        _memoryCache.Set(cacheKey, cachedRate);

        // Act
        var result = await _provider.GetExchangeRateAsync(fromCurrency, toCurrency);

        // Assert
        Assert.Equal(cachedRate, result);
    }

    [Fact]
    public async Task GetExchangeRateAsync_CachedInDatabase_ReturnsCachedValue()
    {
        // Arrange
        var fromCurrency = "USD";
        var toCurrency = "EUR";
        var cachedRate = 0.85m;

        var dbRate = new ExchangeRate
        {
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency,
            Rate = cachedRate,
            Timestamp = DateTime.UtcNow.AddMinutes(-30),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            Source = "exchangerate-api"
        };

        _context.ExchangeRates.Add(dbRate);
        await _context.SaveChangesAsync();

        // Act
        var result = await _provider.GetExchangeRateAsync(fromCurrency, toCurrency);

        // Assert
        Assert.Equal(cachedRate, result);
    }

    [Fact]
    public async Task GetExchangeRateAsync_NotCached_FetchesFromApiAndCaches()
    {
        // Arrange
        var fromCurrency = "USD";
        var toCurrency = "EUR";
        var exchangeRate = 0.85m;

        var apiResponse = new
        {
            result = "success",
            conversion_rates = new Dictionary<string, decimal>
            {
                { toCurrency, exchangeRate }
            }
        };

        var jsonResponse = JsonSerializer.Serialize(apiResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
        };

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(httpResponse);

        // Act
        var result = await _provider.GetExchangeRateAsync(fromCurrency, toCurrency);

        // Assert
        Assert.Equal(exchangeRate, result);

        // Verify it was cached in database
        var savedRate = await _context.ExchangeRates
            .FirstOrDefaultAsync(r => r.FromCurrency == fromCurrency && r.ToCurrency == toCurrency);
        
        Assert.NotNull(savedRate);
        Assert.Equal(exchangeRate, savedRate.Rate);

        // Verify it was cached in memory
        var cacheKey = $"exchange_rate_{fromCurrency}_{toCurrency}";
        Assert.True(_memoryCache.TryGetValue(cacheKey, out decimal cachedValue));
        Assert.Equal(exchangeRate, cachedValue);
    }

    [Fact]
    public async Task GetExchangeRateAsync_ApiFailure_ReturnsNull()
    {
        // Arrange
        var fromCurrency = "USD";
        var toCurrency = "EUR";

        var httpResponse = new HttpResponseMessage(HttpStatusCode.InternalServerError);

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(httpResponse);

        // Act
        var result = await _provider.GetExchangeRateAsync(fromCurrency, toCurrency);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetExchangeRateAsync_CurrencyNotInResponse_ReturnsNull()
    {
        // Arrange
        var fromCurrency = "USD";
        var toCurrency = "XYZ"; // Non-existent currency

        var apiResponse = new
        {
            result = "success",
            conversion_rates = new Dictionary<string, decimal>
            {
                { "EUR", 0.85m },
                { "GBP", 0.75m }
            }
        };

        var jsonResponse = JsonSerializer.Serialize(apiResponse);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
        };

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(httpResponse);

        // Act
        var result = await _provider.GetExchangeRateAsync(fromCurrency, toCurrency);

        // Assert
        Assert.Null(result);
    }

    public void Dispose()
    {
        _httpClient.Dispose();
        _memoryCache.Dispose();
        _context.Dispose();
        if (_serviceProvider is IDisposable disposableProvider)
        {
            disposableProvider.Dispose();
        }
    }
}
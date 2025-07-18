using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using RecurApi.Services;
using Xunit;

namespace RecurApi.Tests;

public class CurrencyDtoMappingTests : IDisposable
{
    private readonly RecurDbContext _context;
    private readonly Mock<IExchangeRateProvider> _mockExchangeRateProvider;
    private readonly Mock<ILogger<CurrencyConversionService>> _mockLogger;
    private readonly IMemoryCache _memoryCache;
    private readonly CurrencyConversionService _currencyService;

    public CurrencyDtoMappingTests()
    {
        var options = new DbContextOptionsBuilder<RecurDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new RecurDbContext(options);
        _mockExchangeRateProvider = new Mock<IExchangeRateProvider>();
        _mockLogger = new Mock<ILogger<CurrencyConversionService>>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        
        _currencyService = new CurrencyConversionService(
            _mockExchangeRateProvider.Object,
            _context,
            _memoryCache,
            _mockLogger.Object);
    }

    [Fact]
    public void CurrencyConversionResult_PropertiesSetCorrectly()
    {
        // Arrange
        var result = new CurrencyConversionResult
        {
            ConvertedAmount = 85.0m,
            ExchangeRate = 0.85m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = false,
            FromCurrency = "USD",
            ToCurrency = "EUR",
            HasError = false,
            ErrorMessage = null
        };

        // Assert
        Assert.Equal(85.0m, result.ConvertedAmount);
        Assert.Equal(0.85m, result.ExchangeRate);
        Assert.Equal("USD", result.FromCurrency);
        Assert.Equal("EUR", result.ToCurrency);
        Assert.False(result.IsStale);
        Assert.False(result.HasError);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void BatchConversionRequest_PropertiesSetCorrectly()
    {
        // Arrange
        var request = new BatchConversionRequest
        {
            Amount = 100.0m,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        // Assert
        Assert.Equal(100.0m, request.Amount);
        Assert.Equal("USD", request.FromCurrency);
        Assert.Equal("EUR", request.ToCurrency);
    }

    [Fact]
    public void ExchangeRateResponse_PropertiesSetCorrectly()
    {
        // Arrange
        var rates = new Dictionary<string, decimal>
        {
            { "EUR", 0.85m },
            { "GBP", 0.75m }
        };

        var response = new ExchangeRateResponse
        {
            BaseCurrency = "USD",
            Rates = rates,
            Timestamp = DateTime.UtcNow,
            Success = true
        };

        // Assert
        Assert.Equal("USD", response.BaseCurrency);
        Assert.Equal(2, response.Rates.Count);
        Assert.Equal(0.85m, response.Rates["EUR"]);
        Assert.Equal(0.75m, response.Rates["GBP"]);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task SubscriptionDto_WithCurrencyConversion_MapsCorrectly()
    {
        // Arrange
        var subscription = new Subscription
        {
            Id = 1,
            Name = "Netflix",
            Cost = 15.99m,
            Currency = "USD",
            BillingCycle = BillingCycle.Monthly,
            UserId = "user1"
        };

        var userDefaultCurrency = "EUR";
        var exchangeRate = 0.85m;

        // Setup mock exchange rate provider
        var mockResponse = new ExchangeRateResponse
        {
            BaseCurrency = "USD",
            Rates = new Dictionary<string, decimal> { { "EUR", exchangeRate } },
            Timestamp = DateTime.UtcNow,
            Success = true
        };

        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ReturnsAsync(mockResponse);

        // Act
        var conversionResult = await _currencyService.ConvertWithMetadataAsync(
            subscription.Cost, subscription.Currency, userDefaultCurrency);

        var subscriptionDto = new SubscriptionDto
        {
            Id = subscription.Id,
            Name = subscription.Name,
            Cost = subscription.Cost,
            Currency = subscription.Currency,
            BillingCycle = subscription.BillingCycle,
            
            // Currency conversion properties
            ConvertedCost = conversionResult.ConvertedAmount,
            ConvertedCurrency = userDefaultCurrency,
            ExchangeRate = conversionResult.ExchangeRate,
            RateTimestamp = conversionResult.RateTimestamp,
            IsConverted = subscription.Currency != userDefaultCurrency,
            IsRateStale = conversionResult.IsStale
        };

        // Assert
        Assert.Equal(subscription.Cost, subscriptionDto.Cost);
        Assert.Equal("USD", subscriptionDto.Currency);
        Assert.Equal(subscription.Cost * exchangeRate, subscriptionDto.ConvertedCost);
        Assert.Equal("EUR", subscriptionDto.ConvertedCurrency);
        Assert.Equal(exchangeRate, subscriptionDto.ExchangeRate);
        Assert.True(subscriptionDto.IsConverted);
        Assert.False(subscriptionDto.IsRateStale);
    }

    [Fact]
    public void DashboardStatsDto_WithCurrencyBreakdown_MapsCorrectly()
    {
        // Arrange
        var currencyBreakdowns = new List<CurrencyBreakdown>
        {
            new()
            {
                Currency = "USD",
                OriginalAmount = 100.0m,
                ConvertedAmount = 85.0m,
                SubscriptionCount = 3
            },
            new()
            {
                Currency = "GBP",
                OriginalAmount = 50.0m,
                ConvertedAmount = 67.0m,
                SubscriptionCount = 2
            }
        };

        var dashboardStats = new DashboardStatsDto
        {
            TotalMonthlyCost = 152.0m, // 85 + 67
            TotalAnnualCost = 1824.0m, // 152 * 12
            DisplayCurrency = "EUR",
            CurrencyBreakdowns = currencyBreakdowns,
            ActiveSubscriptions = 5,
            TotalSubscriptions = 5
        };

        // Assert
        Assert.Equal(152.0m, dashboardStats.TotalMonthlyCost);
        Assert.Equal(1824.0m, dashboardStats.TotalAnnualCost);
        Assert.Equal("EUR", dashboardStats.DisplayCurrency);
        Assert.Equal(2, dashboardStats.CurrencyBreakdowns.Count);
        Assert.Equal(5, dashboardStats.ActiveSubscriptions);

        var usdBreakdown = dashboardStats.CurrencyBreakdowns.First(c => c.Currency == "USD");
        Assert.Equal(100.0m, usdBreakdown.OriginalAmount);
        Assert.Equal(85.0m, usdBreakdown.ConvertedAmount);
        Assert.Equal(3, usdBreakdown.SubscriptionCount);
    }

    [Fact]
    public void CurrencyBreakdown_PropertiesSetCorrectly()
    {
        // Arrange
        var breakdown = new CurrencyBreakdown
        {
            Currency = "USD",
            OriginalAmount = 100.0m,
            ConvertedAmount = 85.0m,
            SubscriptionCount = 3
        };

        // Assert
        Assert.Equal("USD", breakdown.Currency);
        Assert.Equal(100.0m, breakdown.OriginalAmount);
        Assert.Equal(85.0m, breakdown.ConvertedAmount);
        Assert.Equal(3, breakdown.SubscriptionCount);
    }

    [Theory]
    [InlineData("USD", "USD", false)] // Same currency, no conversion
    [InlineData("USD", "EUR", true)]  // Different currency, conversion needed
    [InlineData("GBP", "JPY", true)]  // Different currency, conversion needed
    public void SubscriptionDto_IsConverted_SetCorrectly(string originalCurrency, string displayCurrency, bool expectedIsConverted)
    {
        // Arrange
        var subscriptionDto = new SubscriptionDto
        {
            Currency = originalCurrency,
            ConvertedCurrency = displayCurrency,
            IsConverted = originalCurrency != displayCurrency
        };

        // Assert
        Assert.Equal(expectedIsConverted, subscriptionDto.IsConverted);
    }

    public void Dispose()
    {
        _context.Dispose();
        _memoryCache.Dispose();
    }
}
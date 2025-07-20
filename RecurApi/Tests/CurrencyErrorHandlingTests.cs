using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using RecurApi.Data;
using RecurApi.Models;
using RecurApi.Services;
using Xunit;

namespace RecurApi.Tests;

public class CurrencyErrorHandlingTests : IDisposable
{
    private readonly Mock<IExchangeRateProvider> _mockExchangeRateProvider;
    private readonly RecurDbContext _context;
    private readonly Mock<IServiceProvider> _mockServiceProvider;
    private readonly Mock<IMemoryCache> _mockMemoryCache;
    private readonly Mock<ILogger<CurrencyConversionService>> _mockLogger;
    private readonly CurrencyConversionService _service;

    public CurrencyErrorHandlingTests()
    {
        var options = new DbContextOptionsBuilder<RecurDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new RecurDbContext(options);
        _mockExchangeRateProvider = new Mock<IExchangeRateProvider>();
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockMemoryCache = new Mock<IMemoryCache>();
        _mockLogger = new Mock<ILogger<CurrencyConversionService>>();

        _service = new CurrencyConversionService(
            _mockExchangeRateProvider.Object,
            _context,
            _mockServiceProvider.Object,
            _mockMemoryCache.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_NegativeAmount_ThrowsArgumentException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.ConvertWithMetadataAsync(-10, "USD", "EUR")
        );

        Assert.Equal("Amount cannot be negative", exception.Message);
        Assert.Equal("amount", exception.ParamName);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_NullFromCurrency_ThrowsArgumentException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.ConvertWithMetadataAsync(10, null!, "EUR")
        );

        Assert.Equal("Currency codes cannot be null or empty", exception.Message);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_EmptyToCurrency_ThrowsArgumentException()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.ConvertWithMetadataAsync(10, "USD", "")
        );

        Assert.Equal("Currency codes cannot be null or empty", exception.Message);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_SameCurrency_ReturnsOriginalAmount()
    {
        // Act
        var result = await _service.ConvertWithMetadataAsync(100, "USD", "USD");

        // Assert
        Assert.Equal(100, result.ConvertedAmount);
        Assert.Equal(1.0m, result.ExchangeRate);
        Assert.Equal("USD", result.FromCurrency);
        Assert.Equal("USD", result.ToCurrency);
        Assert.False(result.IsStale);
        Assert.False(result.HasError);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_ExchangeRateProviderFails_ReturnsErrorResult()
    {
        // Arrange
        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ReturnsAsync(new ExchangeRateResponse { Success = false });

        // Mock memory cache miss
        _mockMemoryCache
            .Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object>.IsAny))
            .Returns(false);

        // Database cache miss - no setup needed for in-memory database

        // Act
        var result = await _service.ConvertWithMetadataAsync(100, "USD", "EUR");

        // Assert
        Assert.Equal(100, result.ConvertedAmount); // Fallback to original amount
        Assert.Equal(1.0m, result.ExchangeRate);
        Assert.True(result.IsStale);
        Assert.True(result.HasError);
        Assert.Equal("Currency conversion service temporarily unavailable", result.ErrorMessage);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_HttpRequestException_ReturnsNetworkErrorResult()
    {
        // Arrange
        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ThrowsAsync(new HttpRequestException("Network error"));

        // Mock memory cache miss
        _mockMemoryCache
            .Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object>.IsAny))
            .Returns(false);

        // Act
        var result = await _service.ConvertWithMetadataAsync(100, "USD", "EUR");

        // Assert
        Assert.Equal(100, result.ConvertedAmount);
        Assert.Equal(1.0m, result.ExchangeRate);
        Assert.True(result.IsStale);
        Assert.True(result.HasError);
        Assert.Equal("Network error - using original amount", result.ErrorMessage);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_TaskCanceledException_ReturnsTimeoutErrorResult()
    {
        // Arrange
        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ThrowsAsync(new TaskCanceledException("Request timed out"));

        // Mock memory cache miss
        _mockMemoryCache
            .Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object>.IsAny))
            .Returns(false);

        // Act
        var result = await _service.ConvertWithMetadataAsync(100, "USD", "EUR");

        // Assert
        Assert.Equal(100, result.ConvertedAmount);
        Assert.Equal(1.0m, result.ExchangeRate);
        Assert.True(result.IsStale);
        Assert.True(result.HasError);
        Assert.Equal("Request timed out - using original amount", result.ErrorMessage);
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_UnexpectedException_ReturnsGenericErrorResult()
    {
        // Arrange
        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ThrowsAsync(new InvalidOperationException("Unexpected error"));

        // Mock memory cache miss
        _mockMemoryCache
            .Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object>.IsAny))
            .Returns(false);

        // Act
        var result = await _service.ConvertWithMetadataAsync(100, "USD", "EUR");

        // Assert
        Assert.Equal(100, result.ConvertedAmount);
        Assert.Equal(1.0m, result.ExchangeRate);
        Assert.True(result.IsStale);
        Assert.True(result.HasError);
        Assert.Equal("Conversion failed - displaying original amount", result.ErrorMessage);
    }

    [Fact]
    public async Task GetExchangeRatesAsync_PartialFailure_ReturnsAvailableRatesWithFallbacks()
    {
        // Arrange
        var targetCurrencies = new[] { "EUR", "GBP", "JPY" };
        
        // Mock successful conversion for EUR
        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ReturnsAsync(new ExchangeRateResponse 
            { 
                Success = true, 
                Rates = new Dictionary<string, decimal> { { "EUR", 0.85m } }
            });

        // Mock memory cache miss for all
        _mockMemoryCache
            .Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object>.IsAny))
            .Returns(false);

        // Act
        var result = await _service.GetExchangeRatesAsync("USD", targetCurrencies);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(0.85m, result["EUR"]); // Successful conversion
        Assert.Equal(1.0m, result["GBP"]); // Fallback
        Assert.Equal(1.0m, result["JPY"]); // Fallback
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("US")]
    [InlineData("USDD")]
    public async Task ConvertWithMetadataAsync_InvalidCurrencyFormat_NormalizesAndValidates(string invalidCurrency)
    {
        // Act & Assert
        if (string.IsNullOrWhiteSpace(invalidCurrency))
        {
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.ConvertWithMetadataAsync(100, invalidCurrency, "EUR")
            );
            Assert.Equal("Currency codes cannot be null or empty", exception.Message);
        }
        else
        {
            // For invalid length currencies, the service should still attempt conversion
            // and handle the error gracefully through the exchange rate provider
            var result = await _service.ConvertWithMetadataAsync(100, invalidCurrency, "EUR");
            Assert.NotNull(result);
        }
    }

    [Fact]
    public async Task ConvertWithMetadataAsync_CaseInsensitiveCurrencies_NormalizesCorrectly()
    {
        // Arrange
        _mockExchangeRateProvider
            .Setup(x => x.GetRatesAsync("USD"))
            .ReturnsAsync(new ExchangeRateResponse 
            { 
                Success = true, 
                Rates = new Dictionary<string, decimal> { { "EUR", 0.85m } }
            });

        // Mock memory cache miss
        _mockMemoryCache
            .Setup(x => x.TryGetValue(It.IsAny<object>(), out It.Ref<object>.IsAny))
            .Returns(false);

        // Act
        var result = await _service.ConvertWithMetadataAsync(100, "usd", "eur");

        // Assert
        Assert.Equal("USD", result.FromCurrency);
        Assert.Equal("EUR", result.ToCurrency);
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
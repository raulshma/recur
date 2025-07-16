using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RecurApi.Controllers;
using RecurApi.Services;
using Xunit;

namespace RecurApi.Tests;

public class CurrencyControllerTests
{
    private readonly Mock<ICurrencyConversionService> _mockCurrencyService;
    private readonly Mock<ILogger<CurrencyController>> _mockLogger;
    private readonly CurrencyController _controller;

    public CurrencyControllerTests()
    {
        _mockCurrencyService = new Mock<ICurrencyConversionService>();
        _mockLogger = new Mock<ILogger<CurrencyController>>();
        _controller = new CurrencyController(_mockCurrencyService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetExchangeRates_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var baseCurrency = "USD";
        var targetCurrencies = "EUR,GBP";
        var expectedRates = new Dictionary<string, decimal>
        {
            { "EUR", 0.85m },
            { "GBP", 0.73m }
        };

        _mockCurrencyService
            .Setup(s => s.GetExchangeRatesAsync(baseCurrency, It.IsAny<string[]>()))
            .ReturnsAsync(expectedRates);

        // Act
        var result = await _controller.GetExchangeRates(baseCurrency, targetCurrencies);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ExchangeRatesResponseDto>(okResult.Value);
        
        Assert.Equal(baseCurrency, response.BaseCurrency);
        Assert.Equal(expectedRates, response.Rates);
        Assert.True(response.Success);
        Assert.True(response.Timestamp <= DateTime.UtcNow);
    }

    [Theory]
    [InlineData("", "EUR,GBP")]
    [InlineData("USD", "")]
    [InlineData("US", "EUR")]
    [InlineData("USD", "EURO")]
    public async Task GetExchangeRates_InvalidInput_ReturnsBadRequest(string baseCurrency, string targetCurrencies)
    {
        // Act
        var result = await _controller.GetExchangeRates(baseCurrency, targetCurrencies);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetExchangeRates_TooManyTargetCurrencies_ReturnsBadRequest()
    {
        // Arrange
        var baseCurrency = "USD";
        var targetCurrencies = string.Join(",", Enumerable.Range(1, 25).Select(i => $"C{i:D2}"));

        // Act
        var result = await _controller.GetExchangeRates(baseCurrency, targetCurrencies);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetExchangeRates_ServiceThrowsInvalidOperationException_ReturnsServiceUnavailable()
    {
        // Arrange
        var baseCurrency = "USD";
        var targetCurrencies = "EUR";

        _mockCurrencyService
            .Setup(s => s.GetExchangeRatesAsync(It.IsAny<string>(), It.IsAny<string[]>()))
            .ThrowsAsync(new InvalidOperationException("Service unavailable"));

        // Act
        var result = await _controller.GetExchangeRates(baseCurrency, targetCurrencies);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(503, statusResult.StatusCode);
    }

    [Fact]
    public async Task ConvertCurrency_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100m,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        var expectedResult = new CurrencyConversionResult
        {
            ConvertedAmount = 85m,
            ExchangeRate = 0.85m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = false,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(s => s.ConvertWithMetadataAsync(request.Amount, request.FromCurrency, request.ToCurrency))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CurrencyConversionResponseDto>(okResult.Value);
        
        Assert.Equal(request.Amount, response.OriginalAmount);
        Assert.Equal(expectedResult.ConvertedAmount, response.ConvertedAmount);
        Assert.Equal(expectedResult.FromCurrency, response.FromCurrency);
        Assert.Equal(expectedResult.ToCurrency, response.ToCurrency);
        Assert.Equal(expectedResult.ExchangeRate, response.ExchangeRate);
        Assert.Equal(expectedResult.IsStale, response.IsStale);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task ConvertCurrency_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ConvertCurrency(null!);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Theory]
    [InlineData(0, "USD", "EUR")]
    [InlineData(-10, "USD", "EUR")]
    [InlineData(100, "", "EUR")]
    [InlineData(100, "USD", "")]
    [InlineData(100, "US", "EUR")]
    [InlineData(100, "USD", "EURO")]
    public async Task ConvertCurrency_InvalidRequest_ReturnsBadRequest(decimal amount, string fromCurrency, string toCurrency)
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = amount,
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency
        };

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task ConvertCurrency_SameCurrency_ReturnsOriginalAmount()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100m,
            FromCurrency = "USD",
            ToCurrency = "USD"
        };

        var expectedResult = new CurrencyConversionResult
        {
            ConvertedAmount = 100m,
            ExchangeRate = 1.0m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = false,
            FromCurrency = "USD",
            ToCurrency = "USD"
        };

        _mockCurrencyService
            .Setup(s => s.ConvertWithMetadataAsync(request.Amount, request.FromCurrency, request.ToCurrency))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CurrencyConversionResponseDto>(okResult.Value);
        
        Assert.Equal(100m, response.ConvertedAmount);
        Assert.Equal(1.0m, response.ExchangeRate);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceThrowsInvalidOperationException_ReturnsServiceUnavailable()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100m,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(s => s.ConvertWithMetadataAsync(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Service unavailable"));

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(503, statusResult.StatusCode);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100m,
            FromCurrency = "USD",
            ToCurrency = "INVALID"
        };

        _mockCurrencyService
            .Setup(s => s.ConvertWithMetadataAsync(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new ArgumentException("Invalid currency"));

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100m,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(s => s.ConvertWithMetadataAsync(It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetExchangeRates_CurrencyCodesNormalized_CallsServiceWithUpperCase()
    {
        // Arrange
        var baseCurrency = "usd";
        var targetCurrencies = "eur,gbp";
        var expectedRates = new Dictionary<string, decimal> { { "EUR", 0.85m }, { "GBP", 0.73m } };

        _mockCurrencyService
            .Setup(s => s.GetExchangeRatesAsync("USD", It.Is<string[]>(arr => arr.Contains("EUR") && arr.Contains("GBP"))))
            .ReturnsAsync(expectedRates);

        // Act
        var result = await _controller.GetExchangeRates(baseCurrency, targetCurrencies);

        // Assert
        _mockCurrencyService.Verify(s => s.GetExchangeRatesAsync("USD", It.IsAny<string[]>()), Times.Once);
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ExchangeRatesResponseDto>(okResult.Value);
        Assert.Equal("USD", response.BaseCurrency);
    }

    [Fact]
    public async Task ConvertCurrency_CurrencyCodesNormalized_CallsServiceWithUpperCase()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100m,
            FromCurrency = "usd",
            ToCurrency = "eur"
        };

        var expectedResult = new CurrencyConversionResult
        {
            ConvertedAmount = 85m,
            ExchangeRate = 0.85m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = false,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(s => s.ConvertWithMetadataAsync(100m, "USD", "EUR"))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        _mockCurrencyService.Verify(s => s.ConvertWithMetadataAsync(100m, "USD", "EUR"), Times.Once);
        Assert.IsType<OkObjectResult>(result.Result);
    }
}
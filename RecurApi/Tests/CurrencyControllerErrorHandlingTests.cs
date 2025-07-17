using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RecurApi.Controllers;
using RecurApi.Services;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace RecurApi.Tests;

public class CurrencyControllerErrorHandlingTests
{
    private readonly Mock<ICurrencyConversionService> _mockCurrencyService;
    private readonly Mock<ILogger<CurrencyController>> _mockLogger;
    private readonly CurrencyController _controller;

    public CurrencyControllerErrorHandlingTests()
    {
        _mockCurrencyService = new Mock<ICurrencyConversionService>();
        _mockLogger = new Mock<ILogger<CurrencyController>>();
        _controller = new CurrencyController(_mockCurrencyService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ConvertCurrency_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ConvertCurrency(null!);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task ConvertCurrency_NegativeAmount_ReturnsBadRequest()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = -10,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Theory]
    [InlineData("", "EUR")]
    [InlineData("USD", "")]
    [InlineData("US", "EUR")]
    [InlineData("USD", "EURO")]
    public async Task ConvertCurrency_InvalidCurrencyCodes_ReturnsBadRequest(string fromCurrency, string toCurrency)
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100,
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency
        };

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceThrowsArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(x => x.ConvertWithMetadataAsync(100, "USD", "EUR"))
            .ThrowsAsync(new ArgumentException("Invalid currency codes"));

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceThrowsInvalidOperationException_ReturnsServiceUnavailable()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(x => x.ConvertWithMetadataAsync(100, "USD", "EUR"))
            .ThrowsAsync(new InvalidOperationException("Service unavailable"));

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(503, statusCodeResult.StatusCode);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceThrowsGenericException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        _mockCurrencyService
            .Setup(x => x.ConvertWithMetadataAsync(100, "USD", "EUR"))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    [Fact]
    public async Task ConvertCurrency_ServiceReturnsErrorResult_ReturnsSuccessWithErrorInfo()
    {
        // Arrange
        var request = new CurrencyConversionRequestDto
        {
            Amount = 100,
            FromCurrency = "USD",
            ToCurrency = "EUR"
        };

        var serviceResult = new CurrencyConversionResult
        {
            ConvertedAmount = 100, // Fallback amount
            ExchangeRate = 1.0m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = true,
            FromCurrency = "USD",
            ToCurrency = "EUR",
            HasError = true,
            ErrorMessage = "Exchange rate service temporarily unavailable"
        };

        _mockCurrencyService
            .Setup(x => x.ConvertWithMetadataAsync(100, "USD", "EUR"))
            .ReturnsAsync(serviceResult);

        // Act
        var result = await _controller.ConvertCurrency(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CurrencyConversionResponseDto>(okResult.Value);
        
        Assert.False(response.Success);
        Assert.True(response.HasError);
        Assert.Equal("Exchange rate service temporarily unavailable", response.ErrorMessage);
        Assert.Equal(100, response.ConvertedAmount); // Should return fallback amount
        Assert.True(response.IsStale);
    }

    [Fact]
    public async Task ConvertCurrencyBatch_EmptyRequest_ReturnsBadRequest()
    {
        // Arrange
        var request = new BatchCurrencyConversionRequestDto
        {
            Conversions = new List<CurrencyConversionRequestDto>()
        };

        // Act
        var result = await _controller.ConvertCurrencyBatch(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task ConvertCurrencyBatch_TooManyConversions_ReturnsBadRequest()
    {
        // Arrange
        var conversions = new List<CurrencyConversionRequestDto>();
        for (int i = 0; i < 51; i++) // Exceed the limit of 50
        {
            conversions.Add(new CurrencyConversionRequestDto
            {
                Amount = 100,
                FromCurrency = "USD",
                ToCurrency = "EUR"
            });
        }

        var request = new BatchCurrencyConversionRequestDto
        {
            Conversions = conversions
        };

        // Act
        var result = await _controller.ConvertCurrencyBatch(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task ConvertCurrencyBatch_MixedValidAndInvalidRequests_ReturnsPartialResults()
    {
        // Arrange
        var request = new BatchCurrencyConversionRequestDto
        {
            Conversions = new List<CurrencyConversionRequestDto>
            {
                new() { Amount = 100, FromCurrency = "USD", ToCurrency = "EUR" }, // Valid
                new() { Amount = -50, FromCurrency = "USD", ToCurrency = "EUR" }, // Invalid amount
                new() { Amount = 200, FromCurrency = "", ToCurrency = "EUR" },    // Invalid currency
                new() { Amount = 150, FromCurrency = "GBP", ToCurrency = "USD" }  // Valid
            }
        };

        // Mock successful conversions for valid requests
        _mockCurrencyService
            .Setup(x => x.ConvertWithMetadataAsync(100, "USD", "EUR"))
            .ReturnsAsync(new CurrencyConversionResult
            {
                ConvertedAmount = 85,
                ExchangeRate = 0.85m,
                RateTimestamp = DateTime.UtcNow,
                IsStale = false,
                FromCurrency = "USD",
                ToCurrency = "EUR",
                HasError = false,
                ErrorMessage = null
            });

        _mockCurrencyService
            .Setup(x => x.ConvertWithMetadataAsync(150, "GBP", "USD"))
            .ReturnsAsync(new CurrencyConversionResult
            {
                ConvertedAmount = 180,
                ExchangeRate = 1.2m,
                RateTimestamp = DateTime.UtcNow,
                IsStale = false,
                FromCurrency = "GBP",
                ToCurrency = "USD",
                HasError = false,
                ErrorMessage = null
            });

        // Act
        var result = await _controller.ConvertCurrencyBatch(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<BatchCurrencyConversionResponseDto>(okResult.Value);

        Assert.Equal(4, response.TotalConversions);
        Assert.Equal(2, response.SuccessfulConversions);
        Assert.Equal(2, response.FailedConversions);
        Assert.True(response.HasErrors);

        // Check individual results
        Assert.True(response.Results[0].Success); // Valid USD->EUR
        Assert.False(response.Results[1].Success); // Invalid amount
        Assert.False(response.Results[2].Success); // Invalid currency
        Assert.True(response.Results[3].Success); // Valid GBP->USD

        // Check error messages for failed conversions
        Assert.Equal("Amount must be greater than zero", response.Results[1].ErrorMessage);
        Assert.Equal("Currency codes must be 3-letter codes", response.Results[2].ErrorMessage);
    }

    [Fact]
    public async Task GetExchangeRates_InvalidBaseCurrency_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.GetExchangeRates("", "EUR,GBP");

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task GetExchangeRates_InvalidTargetCurrencies_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.GetExchangeRates("USD", "");

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task GetExchangeRates_TooManyTargetCurrencies_ReturnsBadRequest()
    {
        // Arrange
        var targetCurrencies = string.Join(",", Enumerable.Range(1, 21).Select(i => $"CUR{i:D2}"));

        // Act
        var result = await _controller.GetExchangeRates("USD", targetCurrencies);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var errorResponse = badRequestResult.Value;
        Assert.NotNull(errorResponse);
    }

    [Fact]
    public async Task GetExchangeRates_ServiceFailure_ReturnsRatesWithFallbacks()
    {
        // Arrange
        var rates = new Dictionary<string, decimal>
        {
            { "EUR", 0.85m },
            { "GBP", 1.0m }, // Fallback value
            { "JPY", 1.0m }  // Fallback value
        };

        _mockCurrencyService
            .Setup(x => x.GetExchangeRatesAsync("USD", It.IsAny<string[]>()))
            .ReturnsAsync(rates);

        // Act
        var result = await _controller.GetExchangeRates("USD", "EUR,GBP,JPY");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ExchangeRatesResponseDto>(okResult.Value);

        Assert.True(response.Success);
        Assert.Equal("USD", response.BaseCurrency);
        Assert.Equal(3, response.Rates.Count);
        Assert.Equal(0.85m, response.Rates["EUR"]);
        Assert.Equal(1.0m, response.Rates["GBP"]); // Fallback
        Assert.Equal(1.0m, response.Rates["JPY"]); // Fallback
    }
}
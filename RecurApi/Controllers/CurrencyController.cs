using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RecurApi.Services;
using System.ComponentModel.DataAnnotations;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CurrencyController : ControllerBase
{
    private readonly ICurrencyConversionService _currencyConversionService;
    private readonly ILogger<CurrencyController> _logger;

    public CurrencyController(
        ICurrencyConversionService currencyConversionService,
        ILogger<CurrencyController> logger)
    {
        _currencyConversionService = currencyConversionService;
        _logger = logger;
    }

    /// <summary>
    /// Get current exchange rates for specified currencies
    /// </summary>
    /// <param name="baseCurrency">Base currency code (e.g., USD)</param>
    /// <param name="targetCurrencies">Comma-separated list of target currency codes</param>
    /// <returns>Exchange rates from base currency to target currencies</returns>
    [HttpGet("rates")]
    [EnableRateLimiting("CurrencyApi")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "baseCurrency", "targetCurrencies" })]
    public async Task<ActionResult<ExchangeRatesResponseDto>> GetExchangeRates(
        [FromQuery] [Required] string baseCurrency,
        [FromQuery] [Required] string targetCurrencies)
    {
        try
        {
            // Validate input parameters
            if (string.IsNullOrWhiteSpace(baseCurrency))
            {
                return BadRequest(new { error = "Base currency is required" });
            }

            if (string.IsNullOrWhiteSpace(targetCurrencies))
            {
                return BadRequest(new { error = "Target currencies are required" });
            }

            // Parse and validate currency codes
            var targetCurrencyArray = targetCurrencies
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(c => c.Trim().ToUpperInvariant())
                .Where(c => !string.IsNullOrEmpty(c) && c.Length == 3)
                .Distinct()
                .ToArray();

            if (targetCurrencyArray.Length == 0)
            {
                return BadRequest(new { error = "At least one valid target currency is required" });
            }

            if (targetCurrencyArray.Length > 20)
            {
                return BadRequest(new { error = "Maximum 20 target currencies allowed" });
            }

            baseCurrency = baseCurrency.Trim().ToUpperInvariant();
            if (baseCurrency.Length != 3)
            {
                return BadRequest(new { error = "Base currency must be a 3-letter currency code" });
            }

            // Get exchange rates
            var rates = await _currencyConversionService.GetExchangeRatesAsync(baseCurrency, targetCurrencyArray);

            var response = new ExchangeRatesResponseDto
            {
                BaseCurrency = baseCurrency,
                Rates = rates,
                Timestamp = DateTime.UtcNow,
                Success = true
            };

            // Add cache headers
            Response.Headers.Add("Cache-Control", "public, max-age=3600");
            Response.Headers.Add("ETag", $"\"{baseCurrency}-{string.Join("-", targetCurrencyArray)}-{DateTime.UtcNow:yyyyMMddHH}\"");

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid currency conversion request: {BaseCurrency} to {TargetCurrencies}", 
                baseCurrency, targetCurrencies);
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Currency conversion service error for {BaseCurrency} to {TargetCurrencies}", 
                baseCurrency, targetCurrencies);
            return StatusCode(503, new { error = "Currency conversion service temporarily unavailable" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting exchange rates for {BaseCurrency} to {TargetCurrencies}", 
                baseCurrency, targetCurrencies);
            return StatusCode(500, new { error = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Convert an amount from one currency to another
    /// </summary>
    /// <param name="request">Currency conversion request</param>
    /// <returns>Converted amount with metadata</returns>
    [HttpPost("convert")]
    [EnableRateLimiting("CurrencyConversion")]
    public async Task<ActionResult<CurrencyConversionResponseDto>> ConvertCurrency([FromBody] CurrencyConversionRequestDto request)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                return BadRequest(new { error = "Request body is required" });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new { error = "Amount must be greater than zero" });
            }

            if (string.IsNullOrWhiteSpace(request.FromCurrency) || request.FromCurrency.Length != 3)
            {
                return BadRequest(new { error = "FromCurrency must be a 3-letter currency code" });
            }

            if (string.IsNullOrWhiteSpace(request.ToCurrency) || request.ToCurrency.Length != 3)
            {
                return BadRequest(new { error = "ToCurrency must be a 3-letter currency code" });
            }

            // Normalize currency codes
            request.FromCurrency = request.FromCurrency.Trim().ToUpperInvariant();
            request.ToCurrency = request.ToCurrency.Trim().ToUpperInvariant();

            // Perform conversion
            var result = await _currencyConversionService.ConvertWithMetadataAsync(
                request.Amount, request.FromCurrency, request.ToCurrency);

            var response = new CurrencyConversionResponseDto
            {
                OriginalAmount = request.Amount,
                ConvertedAmount = result.ConvertedAmount,
                FromCurrency = result.FromCurrency,
                ToCurrency = result.ToCurrency,
                ExchangeRate = result.ExchangeRate,
                RateTimestamp = result.RateTimestamp,
                IsStale = result.IsStale,
                Success = true
            };

            // Add cache headers for same-currency conversions
            if (request.FromCurrency == request.ToCurrency)
            {
                Response.Headers.Add("Cache-Control", "public, max-age=86400"); // 24 hours
            }
            else
            {
                Response.Headers.Add("Cache-Control", "public, max-age=3600"); // 1 hour
            }

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid currency conversion request: {Amount} {FromCurrency} to {ToCurrency}", 
                request?.Amount, request?.FromCurrency, request?.ToCurrency);
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Currency conversion service error for {Amount} {FromCurrency} to {ToCurrency}", 
                request?.Amount, request?.FromCurrency, request?.ToCurrency);
            return StatusCode(503, new { error = "Currency conversion service temporarily unavailable" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error converting {Amount} {FromCurrency} to {ToCurrency}", 
                request?.Amount, request?.FromCurrency, request?.ToCurrency);
            return StatusCode(500, new { error = "An unexpected error occurred" });
        }
    }
}

// DTOs for the currency endpoints
public class ExchangeRatesResponseDto
{
    public string BaseCurrency { get; set; } = string.Empty;
    public Dictionary<string, decimal> Rates { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
}

public class CurrencyConversionRequestDto
{
    [Required]
    [Range(0.01, 999999999.99)]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string FromCurrency { get; set; } = string.Empty;

    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string ToCurrency { get; set; } = string.Empty;
}

public class CurrencyConversionResponseDto
{
    public decimal OriginalAmount { get; set; }
    public decimal ConvertedAmount { get; set; }
    public string FromCurrency { get; set; } = string.Empty;
    public string ToCurrency { get; set; } = string.Empty;
    public decimal ExchangeRate { get; set; }
    public DateTime RateTimestamp { get; set; }
    public bool IsStale { get; set; }
    public bool Success { get; set; }
}
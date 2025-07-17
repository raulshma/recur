namespace RecurApi.Services;

public interface ICurrencyConversionService
{
    Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency);
    Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, string[] targetCurrencies);
    Task<CurrencyConversionResult> ConvertWithMetadataAsync(decimal amount, string fromCurrency, string toCurrency);
    Task<List<CurrencyConversionResult>> BatchConvertAsync(List<BatchConversionRequest> requests);
    Task<Dictionary<string, decimal>> GetOptimizedExchangeRatesAsync(string baseCurrency, HashSet<string> targetCurrencies);
    
    // Performance optimization methods
    Task WarmCacheForCommonCurrencyPairsAsync(string baseCurrency);
    Task<List<CurrencyConversionResult>> BatchConvertWithOptimizationAsync(List<BatchConversionRequest> requests);
    Task<Dictionary<string, decimal>> GetFrequentlyUsedRatesAsync(string baseCurrency);
    Task CleanupExpiredCacheEntriesAsync();
    Task PreloadCurrencyPairsAsync(List<(string from, string to)> currencyPairs);
}

public class BatchConversionRequest
{
    public decimal Amount { get; set; }
    public string FromCurrency { get; set; } = string.Empty;
    public string ToCurrency { get; set; } = string.Empty;
    public string? RequestId { get; set; } // Optional identifier for tracking
}

public class CurrencyConversionResult
{
    public decimal ConvertedAmount { get; set; }
    public decimal ExchangeRate { get; set; }
    public DateTime RateTimestamp { get; set; }
    public bool IsStale { get; set; }
    public string FromCurrency { get; set; } = string.Empty;
    public string ToCurrency { get; set; } = string.Empty;
    public bool HasError { get; set; }
    public string? ErrorMessage { get; set; }
}
namespace RecurApi.Services;

public interface ICurrencyConversionService
{
    Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency);
    Task<CurrencyConversionResult> ConvertWithMetadataAsync(decimal amount, string fromCurrency, string toCurrency);
    Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, string[] targetCurrencies);
    Task<List<CurrencyConversionResult>> BatchConvertAsync(List<BatchConversionRequest> requests);
    Task<List<CurrencyConversionResult>> BatchConvertWithOptimizationAsync(List<BatchConversionRequest> requests);
    Task<Dictionary<string, decimal>> GetOptimizedExchangeRatesAsync(string baseCurrency, HashSet<string> targetCurrencies);
    Task WarmCacheForCommonCurrencyPairsAsync(string baseCurrency);
    Task<Dictionary<string, decimal>> GetFrequentlyUsedRatesAsync(string baseCurrency);
    Task CleanupExpiredCacheEntriesAsync();
    Task PreloadCurrencyPairsAsync(List<(string from, string to)> currencyPairs);
}
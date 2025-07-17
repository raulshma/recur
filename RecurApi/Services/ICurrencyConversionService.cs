namespace RecurApi.Services;

public interface ICurrencyConversionService
{
    Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency);
    Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, string[] targetCurrencies);
    Task<CurrencyConversionResult> ConvertWithMetadataAsync(decimal amount, string fromCurrency, string toCurrency);
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
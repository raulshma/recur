namespace RecurApi.Services;

public interface IExchangeRateProvider
{
    Task<ExchangeRateResponse> GetRatesAsync(string baseCurrency);
    Task<decimal?> GetExchangeRateAsync(string fromCurrency, string toCurrency);
}

public class ExchangeRateResponse
{
    public string BaseCurrency { get; set; } = string.Empty;
    public Dictionary<string, decimal> Rates { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
}
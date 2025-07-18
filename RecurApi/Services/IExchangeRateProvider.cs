namespace RecurApi.Services;

public interface IExchangeRateProvider
{
    Task<ExchangeRateResponse> GetRatesAsync(string baseCurrency);
    Task<decimal?> GetExchangeRateAsync(string fromCurrency, string toCurrency);
}
# Design Document

## Overview

This design implements a comprehensive currency formatting and conversion system for the subscription management application. The solution extends the existing currency support by adding real-time conversion capabilities, enhanced formatting, and efficient caching mechanisms. The design maintains backward compatibility while providing a seamless user experience across different currencies.

## Architecture

### High-Level Architecture

The currency system follows a layered architecture:

1. **Frontend Layer**: Enhanced currency formatting utilities and UI components
2. **API Layer**: Currency conversion endpoints and enhanced DTOs
3. **Service Layer**: Currency conversion service with caching
4. **Data Layer**: Exchange rate caching and subscription data with currency metadata

### Data Flow

```
User Request → Frontend Currency Formatter → API Currency Service → Exchange Rate Provider → Cache → Database
```

## Components and Interfaces

### Backend Components

#### 1. Currency Conversion Service (`ICurrencyConversionService`)

```csharp
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
    public string FromCurrency { get; set; }
    public string ToCurrency { get; set; }
}
```

#### 2. Exchange Rate Provider (`IExchangeRateProvider`)

```csharp
public interface IExchangeRateProvider
{
    Task<ExchangeRateResponse> GetRatesAsync(string baseCurrency);
}

public class ExchangeRateResponse
{
    public string BaseCurrency { get; set; }
    public Dictionary<string, decimal> Rates { get; set; }
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
}
```

#### 3. Enhanced DTOs

```csharp
public class SubscriptionDto
{
    // Existing properties...
    public decimal Cost { get; set; }
    public string Currency { get; set; }
    
    // New currency conversion properties
    public decimal? ConvertedCost { get; set; }
    public string? ConvertedCurrency { get; set; }
    public decimal? ExchangeRate { get; set; }
    public DateTime? RateTimestamp { get; set; }
    public bool IsConverted { get; set; }
    public bool IsRateStale { get; set; }
}

public class DashboardStatsDto
{
    // Existing properties...
    public decimal TotalMonthlyCost { get; set; }
    public decimal TotalAnnualCost { get; set; }
    
    // New currency-aware properties
    public string DisplayCurrency { get; set; }
    public List<CurrencyBreakdown> CurrencyBreakdowns { get; set; }
}

public class CurrencyBreakdown
{
    public string Currency { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal ConvertedAmount { get; set; }
    public int SubscriptionCount { get; set; }
}
```

### Frontend Components

#### 1. Enhanced Currency Utilities

```typescript
// Extended currency formatting with conversion support
export interface CurrencyDisplayOptions {
  showOriginal?: boolean;
  showConversionRate?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
}

export interface ConvertedAmount {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  isStale: boolean;
  timestamp: Date;
}

export function formatConvertedCurrency(
  convertedAmount: ConvertedAmount,
  options: CurrencyDisplayOptions = {}
): string;
```

#### 2. Currency Display Components

```typescript
// React component for displaying currency with conversion info
interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  convertedAmount?: ConvertedAmount;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplay({ amount, currency, convertedAmount, showTooltip, size }: CurrencyDisplayProps);
```

## Data Models

### Exchange Rate Cache Model

```csharp
public class ExchangeRate
{
    public int Id { get; set; }
    public string FromCurrency { get; set; }
    public string ToCurrency { get; set; }
    public decimal Rate { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Source { get; set; } // e.g., "exchangerate-api"
}
```

### Enhanced Subscription Model Extensions

The existing `Subscription` model remains unchanged, but we'll add computed properties through extension methods:

```csharp
public static class SubscriptionExtensions
{
    public static async Task<decimal> GetConvertedCostAsync(
        this Subscription subscription, 
        string targetCurrency, 
        ICurrencyConversionService conversionService)
    {
        if (subscription.Currency == targetCurrency)
            return subscription.Cost;
            
        return await conversionService.ConvertAsync(
            subscription.Cost, 
            subscription.Currency, 
            targetCurrency);
    }
}
```

## Error Handling

### Backend Error Handling

1. **Exchange Rate API Failures**
   - Fallback to cached rates (even if slightly stale)
   - Graceful degradation to original currency display
   - Logging for monitoring and alerting

2. **Invalid Currency Codes**
   - Validation at DTO level
   - Clear error messages for unsupported currencies
   - Fallback to USD for unknown currencies

3. **Conversion Failures**
   - Return original amount with error flag
   - User-friendly error messages
   - Retry mechanisms for transient failures

### Frontend Error Handling

1. **Display Fallbacks**
   - Show original currency when conversion fails
   - Clear indicators for conversion unavailability
   - Tooltip explanations for error states

2. **Loading States**
   - Skeleton loaders for currency conversion
   - Progressive enhancement (show original first, then converted)

## Testing Strategy

### Backend Testing

1. **Unit Tests**
   - Currency conversion service logic
   - Exchange rate caching mechanisms
   - DTO mapping with currency conversion
   - Extension method calculations

2. **Integration Tests**
   - Exchange rate API integration
   - Database caching operations
   - End-to-end currency conversion flows

3. **Performance Tests**
   - Bulk conversion operations
   - Cache hit/miss scenarios
   - API rate limiting behavior

### Frontend Testing

1. **Component Tests**
   - Currency display components
   - Formatting utility functions
   - Conversion tooltip behavior

2. **Integration Tests**
   - Currency preference changes
   - Real-time conversion updates
   - Error state handling

### Test Data Strategy

- Mock exchange rate responses for consistent testing
- Test with various currency combinations
- Edge cases: same currency, unsupported currencies, API failures
- Performance testing with large subscription datasets

## Implementation Considerations

### Exchange Rate Provider Selection

**Recommended**: ExchangeRate-API (free tier available)
- Reliable and well-documented
- Supports all major currencies
- Reasonable rate limits for the application scale
- Fallback options available

### Caching Strategy

1. **In-Memory Cache**: For frequently accessed rates (1-hour TTL)
2. **Database Cache**: For persistence across restarts (24-hour TTL)
3. **Cache Warming**: Pre-fetch common currency pairs
4. **Cache Invalidation**: Manual refresh capability for administrators

### Performance Optimizations

1. **Batch Conversions**: Group multiple conversions in single API calls
2. **Lazy Loading**: Convert currencies only when needed for display
3. **Background Updates**: Refresh rates asynchronously
4. **Compression**: Minimize API response sizes

### Security Considerations

1. **API Key Management**: Secure storage of exchange rate API keys
2. **Rate Limiting**: Prevent abuse of conversion endpoints
3. **Input Validation**: Sanitize currency codes and amounts
4. **Audit Logging**: Track currency conversion usage

### Scalability Considerations

1. **Horizontal Scaling**: Stateless conversion service design
2. **Database Optimization**: Indexed exchange rate lookups
3. **CDN Integration**: Cache static currency metadata
4. **Monitoring**: Track conversion performance and API usage
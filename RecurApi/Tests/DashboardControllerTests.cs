using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecurApi.Controllers;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using RecurApi.Services;
using System.Security.Claims;
using Xunit;

namespace RecurApi.Tests;

public class DashboardControllerTests : IDisposable
{
    private readonly RecurDbContext _context;
    private readonly DashboardController _controller;
    private readonly ICurrencyConversionService _currencyService;

    public DashboardControllerTests()
    {
        var options = new DbContextOptionsBuilder<RecurDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new RecurDbContext(options);
        _currencyService = new MockCurrencyConversionService();
        _controller = new DashboardController(_context, _currencyService);

        // Setup user context
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id")
        }));

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = user }
        };

        SeedTestData();
    }

    private void SeedTestData()
    {
        var user = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            PreferredCurrency = "USD"
        };

        var category = new Category
        {
            Id = 1,
            Name = "Entertainment",
            Color = "#FF5733",
            IsDefault = false
        };

        var subscriptions = new[]
        {
            new Subscription
            {
                Id = 1,
                Name = "Netflix",
                Cost = 15.99m,
                Currency = "USD",
                BillingCycle = BillingCycle.Monthly,
                NextBillingDate = DateTime.UtcNow.AddDays(5),
                IsActive = true,
                UserId = "test-user-id",
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow.AddMonths(-2),
                UpdatedAt = DateTime.UtcNow.AddMonths(-2)
            },
            new Subscription
            {
                Id = 2,
                Name = "Spotify",
                Cost = 9.99m,
                Currency = "EUR",
                BillingCycle = BillingCycle.Monthly,
                NextBillingDate = DateTime.UtcNow.AddDays(10),
                IsActive = true,
                UserId = "test-user-id",
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow.AddMonths(-1),
                UpdatedAt = DateTime.UtcNow.AddMonths(-1)
            }
        };

        _context.Users.Add(user);
        _context.Categories.Add(category);
        _context.Subscriptions.AddRange(subscriptions);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetDashboardStats_WithMultipleCurrencies_ReturnsConvertedTotals()
    {
        // Act
        var result = await _controller.GetDashboardStats("USD");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<DashboardStatsDto>(okResult.Value);

        Assert.Equal("USD", stats.DisplayCurrency);
        Assert.Equal(2, stats.ActiveSubscriptions);
        Assert.Equal(2, stats.CurrencyBreakdowns.Count);
        
        // Should have USD and EUR breakdowns
        var usdBreakdown = stats.CurrencyBreakdowns.First(c => c.Currency == "USD");
        var eurBreakdown = stats.CurrencyBreakdowns.First(c => c.Currency == "EUR");
        
        Assert.Equal(15.99m, usdBreakdown.OriginalAmount);
        Assert.Equal(15.99m, usdBreakdown.ConvertedAmount); // No conversion needed
        Assert.Equal(1, usdBreakdown.SubscriptionCount);
        
        Assert.Equal(9.99m, eurBreakdown.OriginalAmount);
        Assert.Equal(10.99m, eurBreakdown.ConvertedAmount); // Mock conversion rate
        Assert.Equal(1, eurBreakdown.SubscriptionCount);
    }

    [Fact]
    public async Task GetUpcomingBills_WithCurrencyConversion_ReturnsConvertedAmounts()
    {
        // Act
        var result = await _controller.GetUpcomingBills("USD");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var bills = Assert.IsType<List<UpcomingBillDto>>(okResult.Value);

        var netflixBill = bills.First(b => b.Name == "Netflix");
        var spotifyBill = bills.First(b => b.Name == "Spotify");

        // Netflix should not be converted (already USD)
        Assert.False(netflixBill.IsConverted);
        Assert.Null(netflixBill.ConvertedAmount);

        // Spotify should be converted from EUR to USD
        Assert.True(spotifyBill.IsConverted);
        Assert.Equal(10.99m, spotifyBill.ConvertedAmount);
        Assert.Equal("USD", spotifyBill.ConvertedCurrency);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

// Mock currency conversion service for testing
public class MockCurrencyConversionService : ICurrencyConversionService
{
    public Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return Task.FromResult(amount);

        // Mock conversion: EUR to USD with rate 1.1
        if (fromCurrency == "EUR" && toCurrency == "USD")
            return Task.FromResult(amount * 1.1m);

        return Task.FromResult(amount);
    }

    public Task<Dictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, string[] targetCurrencies)
    {
        var rates = new Dictionary<string, decimal>();
        foreach (var currency in targetCurrencies)
        {
            rates[currency] = baseCurrency == "EUR" && currency == "USD" ? 1.1m : 1.0m;
        }
        return Task.FromResult(rates);
    }

    public Task<CurrencyConversionResult> ConvertWithMetadataAsync(decimal amount, string fromCurrency, string toCurrency)
    {
        var convertedAmount = fromCurrency == "EUR" && toCurrency == "USD" ? amount * 1.1m : amount;
        
        return Task.FromResult(new CurrencyConversionResult
        {
            ConvertedAmount = convertedAmount,
            ExchangeRate = fromCurrency == "EUR" && toCurrency == "USD" ? 1.1m : 1.0m,
            RateTimestamp = DateTime.UtcNow,
            IsStale = false,
            FromCurrency = fromCurrency,
            ToCurrency = toCurrency
        });
    }
}
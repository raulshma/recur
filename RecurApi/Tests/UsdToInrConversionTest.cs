using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using RecurApi.Data;
using RecurApi.Services;
using Xunit;

namespace RecurApi.Tests;

public class UsdToInrConversionTest
{
    [Fact]
    public async Task GetExchangeRate_UsdToInr_ReturnsValidRate()
    {
        // Arrange
        var services = new ServiceCollection();
        
        // Setup configuration with real API key
        var configurationData = new Dictionary<string, string>
        {
            {"ExchangeRateApi:ApiKey", "96481c1e9dcaa97f6d522c87"}
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData!)
            .Build();
        
        // Setup in-memory database
        services.AddDbContext<RecurDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));
        
        // Add required services
        services.AddMemoryCache();
        services.AddLogging(builder => builder.AddConsole());
        services.AddSingleton<IConfiguration>(configuration);
        services.AddHttpClient();
        services.AddScoped<IExchangeRateProvider, ExchangeRateApiProvider>();
        
        var serviceProvider = services.BuildServiceProvider();
        
        // Get the exchange rate provider
        var exchangeRateProvider = serviceProvider.GetRequiredService<IExchangeRateProvider>();
        
        // Act
        var rate = await exchangeRateProvider.GetExchangeRateAsync("USD", "INR");
        
        // Assert
        Assert.NotNull(rate);
        Assert.True(rate > 0);
        
        // Log the rate for verification
        var logger = serviceProvider.GetRequiredService<ILogger<UsdToInrConversionTest>>();
        logger.LogInformation("USD to INR exchange rate: {Rate}", rate);
    }
}
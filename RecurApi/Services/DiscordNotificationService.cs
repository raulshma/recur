using System.Text;
using System.Text.Json;

namespace RecurApi.Services;

public class DiscordNotificationService : IDiscordNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DiscordNotificationService> _logger;

    public DiscordNotificationService(HttpClient httpClient, ILogger<DiscordNotificationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task SendNotificationAsync(string webhookUrl, string title, string message, string? color = null)
    {
        try
        {
            var embed = new
            {
                title,
                description = message,
                color = color != null ? Convert.ToInt32(color.TrimStart('#'), 16) : 3447003, // Default blue
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                footer = new
                {
                    text = "Recur - Subscription Manager"
                }
            };

            var payload = new
            {
                embeds = new[] { embed }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(webhookUrl, content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to send Discord notification. Status: {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Discord notification");
        }
    }

    public async Task SendTrialEndingNotificationAsync(string webhookUrl, string subscriptionName, int daysRemaining)
    {
        var title = $"{DiscordNotificationTemplates.Emojis.Bell} Trial Ending Soon";
        var message = DiscordNotificationTemplates.CreateTrialEndingMessage(subscriptionName, daysRemaining);
        await SendNotificationAsync(webhookUrl, title, message, DiscordNotificationTemplates.Colors.Orange);
    }

    public async Task SendBillingReminderNotificationAsync(string webhookUrl, string subscriptionName, decimal amount, int daysRemaining)
    {
        var title = $"{DiscordNotificationTemplates.Emojis.CreditCard} Billing Reminder";
        var message = DiscordNotificationTemplates.CreateBillingReminderMessage(subscriptionName, amount, daysRemaining);
        await SendNotificationAsync(webhookUrl, title, message, DiscordNotificationTemplates.Colors.Purple);
    }

    public async Task SendPriceChangeNotificationAsync(string webhookUrl, string subscriptionName, decimal oldPrice, decimal newPrice)
    {
        var title = $"{(newPrice > oldPrice ? DiscordNotificationTemplates.Emojis.Chart : DiscordNotificationTemplates.Emojis.ChartDown)} Price Change Alert";
        var message = DiscordNotificationTemplates.CreatePriceChangeMessage(subscriptionName, oldPrice, newPrice);
        var color = newPrice > oldPrice ? DiscordNotificationTemplates.Colors.Red : DiscordNotificationTemplates.Colors.Green;
        await SendNotificationAsync(webhookUrl, title, message, color);
    }

    public async Task SendRecommendationNotificationAsync(string webhookUrl, string message)
    {
        var title = $"{DiscordNotificationTemplates.Emojis.Bulb} Cost-Saving Recommendation";
        await SendNotificationAsync(webhookUrl, title, message, DiscordNotificationTemplates.Colors.Green);
    }

    public async Task SendBudgetAlertNotificationAsync(string webhookUrl, decimal currentSpending, decimal budgetLimit, string currency = "USD")
    {
        var title = $"{DiscordNotificationTemplates.Emojis.Warning} Budget Alert";
        var message = DiscordNotificationTemplates.CreateBudgetAlertMessage(currentSpending, budgetLimit, currency);
        await SendNotificationAsync(webhookUrl, title, message, DiscordNotificationTemplates.Colors.Red);
    }
}
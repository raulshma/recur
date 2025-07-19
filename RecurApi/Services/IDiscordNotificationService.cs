namespace RecurApi.Services;

public interface IDiscordNotificationService
{
    Task SendNotificationAsync(string webhookUrl, string title, string message, string? color = null);
    Task SendTrialEndingNotificationAsync(string webhookUrl, string subscriptionName, int daysRemaining);
    Task SendBillingReminderNotificationAsync(string webhookUrl, string subscriptionName, decimal amount, int daysRemaining);
    Task SendPriceChangeNotificationAsync(string webhookUrl, string subscriptionName, decimal oldPrice, decimal newPrice);
    Task SendRecommendationNotificationAsync(string webhookUrl, string message);
    Task SendBudgetAlertNotificationAsync(string webhookUrl, decimal currentSpending, decimal budgetLimit, string currency = "USD");
}
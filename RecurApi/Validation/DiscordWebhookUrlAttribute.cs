using System.ComponentModel.DataAnnotations;

namespace RecurApi.Validation;

public class DiscordWebhookUrlAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        {
            return true; // Allow null/empty values, use [Required] if needed
        }

        var url = value.ToString()!;

        try
        {
            var uri = new Uri(url);

            // Check if it's a Discord webhook URL
            if (!uri.Host.Contains("discord.com") && !uri.Host.Contains("discordapp.com"))
            {
                ErrorMessage = "URL must be a Discord webhook URL";
                return false;
            }

            // Check if it contains the webhook path
            if (!uri.AbsolutePath.Contains("/api/webhooks/"))
            {
                ErrorMessage = "Invalid Discord webhook URL format";
                return false;
            }

            // Check if it has the required webhook ID and token parts
            var pathParts = uri.AbsolutePath.Split('/');
            var webhookIndex = Array.IndexOf(pathParts, "webhooks");

            if (webhookIndex == -1 || pathParts.Length < webhookIndex + 3)
            {
                ErrorMessage = "Webhook URL is missing required components";
                return false;
            }

            var webhookId = pathParts[webhookIndex + 1];
            var webhookToken = pathParts[webhookIndex + 2];

            if (string.IsNullOrEmpty(webhookId) || string.IsNullOrEmpty(webhookToken))
            {
                ErrorMessage = "Webhook URL is missing ID or token";
                return false;
            }

            // Basic format checks for ID and token
            if (!long.TryParse(webhookId, out _))
            {
                ErrorMessage = "Invalid webhook ID format";
                return false;
            }

            if (webhookToken.Length < 60)
            {
                ErrorMessage = "Invalid webhook token format";
                return false;
            }

            return true;
        }
        catch
        {
            ErrorMessage = "Invalid URL format";
            return false;
        }
    }
}
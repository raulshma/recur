namespace RecurApi.Services;

public static class DiscordNotificationTemplates
{
    public static class Colors
    {
        public const string Orange = "FFA500";
        public const string Purple = "4169E1";
        public const string Red = "FF0000";
        public const string Green = "00FF00";
        public const string Blue = "3447003";
        public const string Yellow = "FFFF00";
    }

    public static class Emojis
    {
        public const string Bell = "🔔";
        public const string CreditCard = "💳";
        public const string Warning = "⚠️";
        public const string Chart = "📈";
        public const string ChartDown = "📉";
        public const string Bulb = "💡";
        public const string Money = "💰";
        public const string Calendar = "📅";
        public const string Clock = "⏰";
        public const string CheckMark = "✅";
        public const string CrossMark = "❌";
    }

    public static string FormatCurrency(decimal amount, string currency = "USD")
    {
        return currency switch
        {
            "USD" => $"${amount:F2}",
            "EUR" => $"€{amount:F2}",
            "GBP" => $"£{amount:F2}",
            "INR" => $"₹{amount:F2}",
            "JPY" => $"¥{amount:F0}",
            _ => $"{amount:F2} {currency}"
        };
    }

    public static string GetPluralizedDays(int days)
    {
        return days == 1 ? "day" : "days";
    }

    public static string CreateTrialEndingMessage(string subscriptionName, int daysRemaining)
    {
        var urgency = daysRemaining switch
        {
            1 => "**URGENT**",
            <= 3 => "**Soon**",
            _ => ""
        };

        return $"{urgency} Your trial for **{subscriptionName}** expires in **{daysRemaining} {GetPluralizedDays(daysRemaining)}**.\n\n" +
               $"{Emojis.Clock} Don't forget to make a decision before it ends!\n" +
               $"{Emojis.CheckMark} Consider if you want to continue with a paid subscription\n" +
               $"{Emojis.CrossMark} Or cancel to avoid charges";
    }

    public static string CreateBillingReminderMessage(string subscriptionName, decimal amount, int daysRemaining, string currency = "USD")
    {
        var formattedAmount = FormatCurrency(amount, currency);
        
        return $"Your subscription to **{subscriptionName}** will renew in **{daysRemaining} {GetPluralizedDays(daysRemaining)}** for **{formattedAmount}**.\n\n" +
               $"{Emojis.Calendar} Renewal Date: {DateTime.UtcNow.AddDays(daysRemaining):MMM dd, yyyy}\n" +
               $"{Emojis.Money} Amount: {formattedAmount}\n" +
               $"{Emojis.Bell} You can modify or cancel anytime before renewal";
    }

    public static string CreatePriceChangeMessage(string subscriptionName, decimal oldPrice, decimal newPrice, string currency = "USD")
    {
        var oldFormatted = FormatCurrency(oldPrice, currency);
        var newFormatted = FormatCurrency(newPrice, currency);
        var change = newPrice > oldPrice ? "increased" : "decreased";
        var changeEmoji = newPrice > oldPrice ? Emojis.Chart : Emojis.ChartDown;
        var difference = Math.Abs(newPrice - oldPrice);
        var differenceFormatted = FormatCurrency(difference, currency);
        var percentChange = oldPrice > 0 ? Math.Round((difference / oldPrice) * 100, 1) : 0;

        return $"{changeEmoji} The price for **{subscriptionName}** has {change} from **{oldFormatted}** to **{newFormatted}**.\n\n" +
               $"**Change Details:**\n" +
               $"• Previous: {oldFormatted}\n" +
               $"• New: {newFormatted}\n" +
               $"• Difference: {(newPrice > oldPrice ? "+" : "-")}{differenceFormatted} ({percentChange}%)\n\n" +
               $"{Emojis.Bell} Review your subscription to decide if you want to continue.";
    }

    public static string CreateBudgetAlertMessage(decimal currentSpending, decimal budgetLimit, string currency = "USD")
    {
        var spendingFormatted = FormatCurrency(currentSpending, currency);
        var budgetFormatted = FormatCurrency(budgetLimit, currency);
        var percentUsed = Math.Round((currentSpending / budgetLimit) * 100, 1);
        var remaining = budgetLimit - currentSpending;
        var remainingFormatted = FormatCurrency(remaining, currency);

        return $"{Emojis.Warning} You've reached **{percentUsed}%** of your monthly budget!\n\n" +
               $"**Budget Status:**\n" +
               $"• Spent: {spendingFormatted}\n" +
               $"• Budget: {budgetFormatted}\n" +
               $"• Remaining: {remainingFormatted}\n\n" +
               $"{Emojis.Bulb} Consider reviewing your subscriptions to stay within budget.";
    }
}
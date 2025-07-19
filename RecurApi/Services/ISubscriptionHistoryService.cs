using RecurApi.Models;
using RecurApi.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace RecurApi.Services;

public interface ISubscriptionHistoryService
{
    Task RecordEventAsync(int subscriptionId, string userId, SubscriptionEventType eventType, string title, string description, object? details = null, object? previousValues = null, object? newValues = null);
    Task<IEnumerable<SubscriptionHistory>> GetHistoryAsync(int subscriptionId);
    Task RecordTrialEndEventAsync(int subscriptionId, string userId, string subscriptionName, DateTime trialEndDate, DateTime createdAt);
}

public class SubscriptionHistoryService : ISubscriptionHistoryService
{
    private readonly RecurDbContext _context;
    private readonly JsonSerializerOptions _jsonOptions;

    public SubscriptionHistoryService(RecurDbContext context)
    {
        _context = context;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task RecordEventAsync(int subscriptionId, string userId, SubscriptionEventType eventType, string title, string description, object? details = null, object? previousValues = null, object? newValues = null)
    {
        var historyEntry = new SubscriptionHistory
        {
            SubscriptionId = subscriptionId,
            UserId = userId,
            EventType = eventType.ToString().ToLowerInvariant(),
            Title = title,
            Description = description,
            Timestamp = DateTime.UtcNow,
            Details = details != null ? JsonSerializer.Serialize(details, _jsonOptions) : null,
            PreviousValues = previousValues != null ? JsonSerializer.Serialize(previousValues, _jsonOptions) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues, _jsonOptions) : null
        };

        _context.SubscriptionHistory.Add(historyEntry);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<SubscriptionHistory>> GetHistoryAsync(int subscriptionId)
    {
        return await _context.SubscriptionHistory
            .Where(h => h.SubscriptionId == subscriptionId)
            .OrderByDescending(h => h.Timestamp)
            .ToListAsync();
    }

    public async Task RecordTrialEndEventAsync(int subscriptionId, string userId, string subscriptionName, DateTime trialEndDate, DateTime createdAt)
    {
        var trialDurationDays = (int)(trialEndDate - createdAt).TotalDays;
        
        await RecordEventAsync(
            subscriptionId,
            userId,
            SubscriptionEventType.TrialEnded,
            "Trial Period Ended",
            $"Trial period for {subscriptionName} has ended",
            new
            {
                trialEndDate = trialEndDate,
                trialDurationDays = trialDurationDays,
                trialDuration = $"{trialDurationDays} days"
            });
    }
} 
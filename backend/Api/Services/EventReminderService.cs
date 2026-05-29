using Api.Database;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services
{
    public class EventReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EventReminderService> _logger;

        public EventReminderService(IServiceProvider serviceProvider, ILogger<EventReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("EventReminderService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessRemindersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing event reminders.");
                }

                // Run every 60 seconds
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }

            _logger.LogInformation("EventReminderService is stopping.");
        }

        private async Task ProcessRemindersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var now = DateTime.UtcNow;
            var tomorrowStart = now.Date.AddDays(1);
            var tomorrowEnd = tomorrowStart.AddDays(1);

            // Find events happening tomorrow (between midnight tonight and midnight tomorrow night UTC)
            var upcomingEvents = await db.Events
                .Where(e => e.Date >= tomorrowStart && e.Date < tomorrowEnd)
                .ToListAsync();

            if (upcomingEvents.Count == 0)
                return;

            foreach (var ev in upcomingEvents)
            {
                // Get users with active tickets for this event
                var activeTicketHolders = await db.PurchasedTickets
                    .Include(pt => pt.User)
                    .Where(pt => pt.EventId == ev.Id && pt.Status == PurchasedTicketStatus.Active)
                    .Select(pt => pt.User)
                    .Distinct()
                    .ToListAsync();

                foreach (var user in activeTicketHolders)
                {
                    // Deduplication logic: Check if we've already sent an EventReminder for this user+event combo
                    var alreadySent = await db.Notifications
                        .AnyAsync(n => n.UserId == user.Id && n.EventId == ev.Id && n.Type == "EventReminder");

                    if (!alreadySent)
                    {
                        // 1. Create In-App Notification
                        var notification = new Notification
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            EventId = ev.Id,
                            Type = "EventReminder",
                            Title = "Event Reminder",
                            Message = $"Friendly reminder: {ev.Title} is happening tomorrow! Check your tickets.",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };

                        db.Notifications.Add(notification);

                        // 2. Send Email
                        await emailService.SendEventReminderEmailAsync(
                            user.Email,
                            ev.Title,
                            ev.Date.ToString("MMMM d, yyyy"),
                            ev.Location
                        );

                        _logger.LogInformation("Sent day-before reminder to User {UserId} for Event {EventId}", user.Id, ev.Id);
                    }
                }
            }

            await db.SaveChangesAsync();
        }
    }
}

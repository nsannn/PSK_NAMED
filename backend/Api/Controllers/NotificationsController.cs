using System.Security.Claims;
using Api.Database;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public Guid? EventId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(ApplicationDbContext db, IEmailService emailService, ILogger<NotificationsController> logger)
        {
            _db = db;
            _emailService = emailService;
            _logger = logger;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var query = _db.Notifications
                .Where(n => n.UserId == userId);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    EventId = n.EventId,
                    Type = n.Type,
                    Title = n.Title,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var count = await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();

            return Ok(new { count });
        }

        // POST: api/notifications/{id}/read
        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _db.SaveChangesAsync();

            return Ok();
        }

        // POST: api/notifications/read-all
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

            return Ok();
        }

        // GET: api/notifications/event/{eventId}/can-send-reminder
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpGet("event/{eventId:guid}/can-send-reminder")]
        public async Task<IActionResult> CanSendReminder(Guid eventId)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var oneDayAgo = DateTime.UtcNow.AddHours(-24);
            var recentReminder = await _db.Notifications
                .Where(n => n.EventId == eventId && n.Type == "ManagerReminder" && n.CreatedAt > oneDayAgo)
                .OrderByDescending(n => n.CreatedAt)
                .FirstOrDefaultAsync();

            if (recentReminder != null)
            {
                var nextAvailableAt = recentReminder.CreatedAt.AddHours(24);
                return Ok(new { canSend = false, nextAvailableAt });
            }

            return Ok(new { canSend = true });
        }

        // POST: api/notifications/event/{eventId}/send-reminder
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpPost("event/{eventId:guid}/send-reminder")]
        public async Task<IActionResult> SendReminder(Guid eventId)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var ev = await _db.Events
                .Include(e => e.Tickets)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (ev == null)
                return NotFound(new { message = "Event not found." });

            // Managers can only send reminders for their own events
            if (User.IsInRole("Manager") && ev.CreatedByUserId != userId)
                return Forbid();

            // Check rate limit: once per day per event
            var oneDayAgo = DateTime.UtcNow.AddHours(-24);
            var recentReminder = await _db.Notifications
                .Where(n => n.EventId == eventId && n.Type == "ManagerReminder" && n.CreatedAt > oneDayAgo)
                .AnyAsync();

            if (recentReminder)
                return StatusCode(429, new { message = "A reminder was already sent for this event in the last 24 hours." });

            // Get all distinct users with active tickets for this event
            var users = await _db.PurchasedTickets
                .Where(pt => pt.EventId == eventId && pt.Status == PurchasedTicketStatus.Active)
                .Select(pt => pt.User)
                .Distinct()
                .ToListAsync();

            if (users.Count == 0)
                return Ok(new { message = "No ticket holders found for this event.", count = 0 });

            var now = DateTime.UtcNow;
            var notifications = users.Select(u => new Notification
            {
                Id = Guid.NewGuid(),
                UserId = u.Id,
                EventId = eventId,
                Type = "ManagerReminder",
                Title = "Event Reminder",
                Message = $"Reminder: {ev.Title} is coming up on {ev.Date:MMMM d, yyyy 'at' h:mm tt 'UTC'}. Don't forget to attend!",
                IsRead = false,
                CreatedAt = now
            }).ToList();

            _db.Notifications.AddRange(notifications);
            await _db.SaveChangesAsync();

            // Send emails to everyone
            foreach (var u in users)
            {
                await _emailService.SendEventReminderEmailAsync(
                    u.Email,
                    ev.Title,
                    ev.Date.ToUniversalTime().ToString("MMMM d, yyyy 'at' h:mm tt 'UTC'"),
                    ev.Location,
                    isManualBlast: true
                );
            }

            _logger.LogInformation(
                "Manager {UserId} sent reminder for event {EventId} to {Count} users",
                userId, eventId, users.Count);

            return Ok(new { message = $"Reminder sent to {users.Count} ticket holder(s).", count = users.Count });
        }

        private Guid GetUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr);
        }
    }
}

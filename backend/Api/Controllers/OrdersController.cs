using Api.Database;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(ApplicationDbContext db, ILogger<OrdersController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpGet("event/{eventId}")]
        public async Task<IActionResult> GetEventOrders(Guid eventId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr);

            var ev = await _db.Events.FindAsync(eventId);
            if (ev == null)
                return NotFound();

            var isAdmin = User.IsInRole("Admin");
            if (ev.CreatedByUserId != userId && !isAdmin)
                return Forbid();

            var orders = await _db.Orders
                .Where(o => o.EventId == eventId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new {
                    o.Id,
                    o.EventId,
                    o.UserId,
                    o.CustomerEmail,
                    o.Quantity,
                    o.AmountPaid,
                    o.StripePaymentIntentId,
                    o.StripeSessionId,
                    Status = o.Status.ToString(),
                    o.CreatedAt,
                    o.RefundedAt
                })
                .ToListAsync();

            return Ok(orders);
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost("{orderId}/refund")]
        public async Task<IActionResult> RefundOrder(Guid orderId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr);

            var order = await _db.Orders
                .Include(o => o.Event)
                .Include(o => o.Event.Tickets)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return NotFound();
            
            var isAdmin = User.IsInRole("Admin");
            if (order.Event.CreatedByUserId != userId && !isAdmin)
             return Forbid();
            
            if (order.Status == OrderStatus.Refunded) return BadRequest(new { message = "Already refunded." });

            try
            {
                var refundOptions = new RefundCreateOptions
                {
                    PaymentIntent = order.StripePaymentIntentId
                };
                var service = new RefundService();
                var stripeRefund = await service.CreateAsync(refundOptions);

                if (stripeRefund.Status == "succeeded" || stripeRefund.Status == "pending")
                {
                    order.Status = OrderStatus.Refunded;
                    order.RefundedAt = DateTime.UtcNow;

                    var priceInfo = (order.AmountPaid / order.Quantity);
                    var ticketTier = order.Event.Tickets.FirstOrDefault(t => t.Price == priceInfo) ?? order.Event.Tickets.FirstOrDefault();
                    if (ticketTier != null && ticketTier.Sold >= order.Quantity)
                    {
                        ticketTier.Sold -= order.Quantity;
                    }

                    await _db.SaveChangesAsync();
                    return Ok(new { message = "Refund successful." });
                }

                return BadRequest(new { message = "Refund failed in Stripe." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refund order");
                return StatusCode(500, new { message = "Internal error processing refund" });
            }
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost("event/{eventId}/refund-all")]
        public async Task<IActionResult> RefundAllOrders(Guid eventId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr);

            var ev = await _db.Events.Include(e => e.Tickets).FirstOrDefaultAsync(e => e.Id == eventId);
            if (ev == null) return NotFound();
            
            var isAdmin = User.IsInRole("Admin");
            if (ev.CreatedByUserId != userId && !isAdmin)
             return Forbid();

            var orders = await _db.Orders
                .Where(o => o.EventId == eventId && o.Status == OrderStatus.Paid)
                .ToListAsync();

            var service = new RefundService();
            int refundCount = 0;

            foreach (var order in orders)
            {
                try
                {
                    if (string.IsNullOrEmpty(order.StripePaymentIntentId)) continue;
                    
                    var stripeRefund = await service.CreateAsync(new RefundCreateOptions
                    {
                        PaymentIntent = order.StripePaymentIntentId
                    });
                    
                    if (stripeRefund.Status == "succeeded" || stripeRefund.Status == "pending")
                    {
                        order.Status = OrderStatus.Refunded;
                        order.RefundedAt = DateTime.UtcNow;
                        
                        var priceInfo = (order.AmountPaid / order.Quantity);
                        var ticketTier = ev.Tickets.FirstOrDefault(t => t.Price == priceInfo) ?? ev.Tickets.FirstOrDefault();
                        if (ticketTier != null && ticketTier.Sold >= order.Quantity)
                        {
                            ticketTier.Sold -= order.Quantity;
                        }
                        
                        refundCount++;
                    }
                }
                catch (Exception e)
                {
                    _logger.LogWarning(e, "Could not refund order {OrderId}", order.Id);
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = $"Refunded {refundCount} orders." });
        }
    }
}
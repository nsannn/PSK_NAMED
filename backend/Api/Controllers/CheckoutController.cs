using System.Security.Claims;
using Api.Database;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe.Checkout;
using Stripe;
using Api.Services;

namespace Api.Controllers
{
    // TEMP DTO
    public class CreateCheckoutSessionRequest
    {
        public Guid EventId { get; set; }
        public List<SessionReqTicket> Tickets { get; set; }=new ();
    }

    public class SessionReqTicket {
        public Guid TicketId { get; set; }
        public int Quantity { get; set; }=1;
    }


    [ApiController]
    [Route("api/[controller]")]
    public class CheckoutController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly ILogger<CheckoutController> _logger;

        public CheckoutController(ApplicationDbContext db, IEmailService emailService, IConfiguration config, ILogger<CheckoutController> logger)
        {
            _db = db;
            _emailService = emailService;
            _config = config;
            _logger = logger;
        }

        [Authorize]
        [HttpPost("create-session")]
        public async Task<IActionResult> CreateSession([FromBody] CreateCheckoutSessionRequest req)
        {            
            var frontendBaseUrl = _config["FRONTEND_BASE_URL"]?.TrimEnd('/');
            if(string.IsNullOrWhiteSpace(frontendBaseUrl))
                return StatusCode(500, new {message = "FRONTEND_BASE_URL is not configured."});
            
            var selectedTickets=req.Tickets
                .Where(t => t.Quantity > 0)
                .ToList();
            
            var totalQuantity=selectedTickets.Sum(t => t.Quantity);
            if(totalQuantity < 1 || totalQuantity > 10)
                return BadRequest(new {message = "Quantity must be between 1 and 10."});

            var ev = await _db.Events
                .Include(e => e.Tickets)
                .FirstOrDefaultAsync(e => e.Id == req.EventId);
            if(ev == null)
                return NotFound(new {message = "Event not found."});

            var lineItems=new List<SessionLineItemOptions>();
            foreach(var ticket in selectedTickets) {
                var ticketTier=ev.Tickets
                    .FirstOrDefault(t => t.Id == ticket.TicketId);

                if(ticketTier==null)
                    return NotFound(new {message = "Ticket not found."});
                if(ticketTier.Quantity-ticketTier.Sold < ticket.Quantity)
                    return BadRequest(new {message = $"Not enough {ticketTier.Type} tickets available."});
                if(ticketTier.Price <= 0)
                    return BadRequest(new {message = $"{ticketTier.Type} ticket is not purchasable."});
                
                lineItems.Add(new SessionLineItemOptions {
                    PriceData = new SessionLineItemPriceDataOptions {
                        Currency = "eur",
                        UnitAmount = (long)Math.Round(ticketTier.Price * 100m, MidpointRounding.AwayFromZero),
                        ProductData = new SessionLineItemPriceDataProductDataOptions {
                            Name = $"{ev.Title} - {ticketTier.Type}",
                            Description = $"{ev.Location} - {ev.Date:MMMM d, yyyy}"
                        }
                    },
                    Quantity = ticket.Quantity
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userEmail = User.FindFirstValue(ClaimTypes.Email);

            var ticketItemsMetadata = string.Join(",",selectedTickets.Select(t => $"{t.TicketId}:{t.Quantity}"));

            var metadata = new Dictionary<string,string> {
                {"eventId", ev.Id.ToString()},
                {"userId", userId ?? ""},
                {"quantity", totalQuantity.ToString()},
                {"ticketItems", ticketItemsMetadata}
            };

            try {
                // Build the Stripe Checkout Session
                var options = new SessionCreateOptions {
                    Mode = "payment",
                    CustomerEmail = userEmail,
                    LineItems = lineItems,
                    Metadata = metadata,
                    PaymentIntentData = new SessionPaymentIntentDataOptions {
                        Metadata = metadata
                    },
                    SuccessUrl = $"{frontendBaseUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                    CancelUrl = $"{frontendBaseUrl}/event/{ev.Id}"
                };

                var service = new SessionService();
                var session = await service.CreateAsync(options);

                return Ok(new {sessionUrl = session.Url});
            } catch(Stripe.StripeException ex) {
                _logger.LogError(ex, "Stripe error creating checkout session for event {EventId}", req.EventId);
                return StatusCode(502, new { message = $"Stripe error: {ex.Message}" });
            }
        }

        [Authorize]
        [HttpGet("session-status")]
        public async Task<IActionResult> SessionStatus([FromQuery] string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                return BadRequest(new { message = "sessionId is required." });

            try
            {
                var service = new SessionService();
                var session = await service.GetAsync(sessionId);

                // Pull the event name from metadata so the success page can display it
                var eventName = "Unknown Event";
                var ticketSummary = new List<object>();
                if (session.Metadata.TryGetValue("eventId", out var eid) && Guid.TryParse(eid, out var eventId))
                {
                    var ev = await _db.Events
                        .Include(e => e.Tickets)
                        .FirstOrDefaultAsync(e => e.Id == eventId);
                    if (ev != null) {
                        eventName = ev.Title;

                        var ticketItemsRaw = session.Metadata.GetValueOrDefault("ticketItems", "");

                        foreach(var item in ticketItemsRaw.Split(',',StringSplitOptions.RemoveEmptyEntries)) {
                            var parts = item.Split(':');

                            if(parts.Length != 2)
                                continue;
                            if(!Guid.TryParse(parts[0], out var ticketId))
                                continue;
                            if(!int.TryParse(parts[1], out var quantity))
                                continue;

                            var ticket = ev.Tickets.FirstOrDefault(t => t.Id == ticketId);

                            ticketSummary.Add(new {
                                ticketId,
                                ticketType = ticket?.Type ?? "Unknown",
                                quantity,
                                price = ticket?.Price
                            });
                        }
                    }
                }

                return Ok(new
                {
                    status = session.PaymentStatus,           // "paid" | "unpaid" | "no_payment_required"
                    customerEmail = session.CustomerEmail,
                    eventName,
                    quantity = session.Metadata.GetValueOrDefault("quantity", "1"),
                    tickets = ticketSummary
                });
            }
            catch (Stripe.StripeException ex)
            {
                _logger.LogError(ex, "Stripe exception while retrieving checkout session status.");
                return StatusCode(502, new { message = "Payment gateway error." });
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var endpointSecret = _config["STRIPE_WEBHOOK_SECRET"];

            try {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    endpointSecret
                );

                if (stripeEvent.Type != "checkout.session.completed")
                    return Ok();
                    
                var session = stripeEvent.Data.Object as Session;

                if (session == null)
                    return Ok();

                if (await _db.Orders.AnyAsync(o => o.StripeSessionId == session.Id))
                    return Ok();

                if (!session.Metadata.TryGetValue("eventId", out var eventIdValue) || !Guid.TryParse(eventIdValue, out var eventId)) {
                    _logger.LogWarning("Stripe session {SessionId} missing valid eventId metadata.", session.Id);
                    return BadRequest();
                }

                if (!session.Metadata.TryGetValue("userId", out var userIdValue) || !Guid.TryParse(userIdValue, out var userId)) {
                    _logger.LogWarning("Stripe session {SessionId} missing valid userId metadata.", session.Id);
                    return BadRequest();
                }

                if (!session.Metadata.TryGetValue("ticketItems", out var ticketItemsValue) || string.IsNullOrWhiteSpace(ticketItemsValue)) {
                    _logger.LogWarning("Stripe session {SessionId} missing ticketItems metadata.", session.Id);
                    return BadRequest();
                }

                var ev = await _db.Events
                    .Include(e => e.Tickets)
                    .FirstOrDefaultAsync(e => e.Id == eventId);

                if (ev == null) {
                    _logger.LogWarning("Event {EventId} from Stripe session {SessionId} was not found.", eventId, session.Id);
                    return BadRequest();
                }

                var ticketItems = new List<SessionReqTicket>();
                foreach(var item in ticketItemsValue.Split(',', StringSplitOptions.RemoveEmptyEntries)) {
                    var parts = item.Split(':', StringSplitOptions.RemoveEmptyEntries);

                    if(parts.Length != 2 ||
                        !Guid.TryParse(parts[0], out var ticketId) ||
                        !int.TryParse(parts[1], out var quantity) ||
                        quantity <=0) {
                        _logger.LogWarning("Invalid ticketItems metadata item '{Item}' in Stripe session {SessionId}.", item, session.Id);
                        return BadRequest();
                    }

                    ticketItems.Add(new SessionReqTicket{
                        TicketId = ticketId,
                        Quantity = quantity
                    });
                }

                var totalQuantity = ticketItems.Sum(t => t.Quantity);

                var order = new Order {
                    Id = Guid.NewGuid(),
                    EventId = ev.Id,
                    UserId = userId,
                    CustomerEmail = session.CustomerEmail ?? "unknown@example.com",
                    Quantity = totalQuantity,
                    AmountPaid = (session.AmountTotal ?? 0) / 100m,
                    StripeSessionId = session.Id,
                    StripePaymentIntentId = session.PaymentIntentId ?? "",
                    Status = OrderStatus.Paid,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Orders.Add(order);

                foreach(var item in ticketItems) {
                    var ticketTier = ev.Tickets.FirstOrDefault(t => t.Id == item.TicketId);

                    if(ticketTier == null) {
                        _logger.LogWarning(
                            "Ticket tier {TicketId} from Stripe session {SessionId} was not found.",
                            item.TicketId,
                            session.Id
                        );
                        return BadRequest();
                    }

                    var available = ticketTier.Quantity - ticketTier.Sold;

                    if(available < item.Quantity) {
                        _logger.LogWarning(
                            "Not enough tickets for tier {TicketId}. Requested {Requested}, available {Available}. Session {SessionId}.",
                            item.TicketId,
                            item.Quantity,
                            available,
                            session.Id
                        );
                        return BadRequest();
                    }

                    ticketTier.Sold += item.Quantity;

                    for(int i = 0; i < item.Quantity; i++) {
                        _db.PurchasedTickets.Add(new PurchasedTicket {
                            Id = Guid.NewGuid(),
                            Order = order,
                            UserId = userId,
                            EventId = ev.Id,
                            TicketId = ticketTier.Id,
                            EventNameSnapshot = ev.Title,
                            EventDateSnapshot = ev.Date,
                            TicketTypeSnapshot = ticketTier.Type,
                            PriceSnapshot = ticketTier.Price,
                            Status = PurchasedTicketStatus.Active,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                await _db.SaveChangesAsync();

                if(!string.IsNullOrEmpty(session.CustomerEmail))
                    await _emailService.SendTicketConfirmationEmailAsync(
                        session.CustomerEmail,
                        ev.Title,
                        totalQuantity,
                        ev.Date.ToString("MMMM d, yyyy"),
                        ev.Location
                    );

                return Ok();
            }
            catch (StripeException e)
            {
                _logger.LogWarning(e, "Stripe webhook signature validation failed.");
                return BadRequest();
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Unhandled error processing Stripe webhook");
                return StatusCode(500);
            }
        }
    }
}

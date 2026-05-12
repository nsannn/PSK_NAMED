using System.Security.Claims;
using Api.Database;
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
        // TEMP: currently uses fictional seeded event ID
        public Guid EventId { get; set; }

        public int Quantity { get; set; } = 1;
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
            if (req.Quantity < 1 || req.Quantity > 10)
                return BadRequest(new { message = "Quantity must be between 1 and 10." });

            var ev = await _db.Events
                .Include(e => e.Tickets)
                .FirstOrDefaultAsync(e => e.Id == req.EventId);
            if (ev == null)
                return NotFound(new { message = "Event not found." });

            var availableTickets = ev.Tickets.Sum(t => t.Quantity - t.Sold);
            if (availableTickets < req.Quantity)
                return BadRequest(new { message = "Not enough tickets available." });

            var price = ev.Tickets
                .OrderBy(t => t.Price)
                .Select(t => t.Price)
                .FirstOrDefault();

            if (price <= 0)
                return BadRequest(new { message = "Event has no purchasable tickets." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userEmail = User.FindFirstValue(ClaimTypes.Email);

            try
            {
                // Build the Stripe Checkout Session
                var options = new SessionCreateOptions
                {
                    Mode = "payment",
                    CustomerEmail = userEmail,
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            PriceData = new SessionLineItemPriceDataOptions
                            {
                                Currency = "eur",
                                UnitAmount = (long)Math.Round(price * 100m, MidpointRounding.AwayFromZero),
                                ProductData = new SessionLineItemPriceDataProductDataOptions
                                {
                                    Name = ev.Title,
                                    Description = $"{ev.Location} — {ev.Date:MMMM d, yyyy}",
                                },
                            },
                            Quantity = req.Quantity,
                        },
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        { "eventId", ev.Id.ToString() },
                        { "userId", userId ?? "" },
                        { "quantity", req.Quantity.ToString() },
                    },
                    // TEMP: Hardcoded localhost URLs
                    SuccessUrl = "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
                    CancelUrl  = $"http://localhost:3000/event/{ev.Id}",
                };

                var service = new SessionService();
                var session = await service.CreateAsync(options);

                return Ok(new { sessionUrl = session.Url });
            }
            catch (Stripe.StripeException ex)
            {
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
                if (session.Metadata.TryGetValue("eventId", out var eid) && Guid.TryParse(eid, out var eventId))
                {
                    var ev = await _db.Events.FindAsync(eventId);
                    if (ev != null) eventName = ev.Title;
                }

                return Ok(new
                {
                    status = session.PaymentStatus,           // "paid" | "unpaid" | "no_payment_required"
                    customerEmail = session.CustomerEmail,
                    eventName,
                    quantity = session.Metadata.GetValueOrDefault("quantity", "1"),
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

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    endpointSecret
                );

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;

                    if (session != null)
                    {
                        var customerEmail = session.CustomerEmail;
                        var quantityStr = session.Metadata.GetValueOrDefault("quantity", "1");
                        var quantity = int.TryParse(quantityStr, out var q) ? q : 1;
                        var eventName = "Unknown Event";
                        var eventDate = "";
                        var eventLocation = "";

                        if (session.Metadata.TryGetValue("eventId", out var eid) && Guid.TryParse(eid, out var eventId))
                        {
                            var ev = await _db.Events
                                .Include(e => e.Tickets)
                                .FirstOrDefaultAsync(e => e.Id == eventId);

                            if (ev != null)
                            {
                                eventName = ev.Title;
                                eventDate = ev.Date.ToString("MMMM d, yyyy");
                                eventLocation = ev.Location;

                                // Deduct ticket quantity
                                var availableTicketTier = ev.Tickets.FirstOrDefault(t => t.Quantity - t.Sold >= quantity);
                                if (availableTicketTier != null)
                                {
                                    availableTicketTier.Sold += quantity;
                                    await _db.SaveChangesAsync();
                                }
                            }
                        }

                        // Send Email
                        if (!string.IsNullOrEmpty(customerEmail))
                        {
                            await _emailService.SendTicketConfirmationEmailAsync(
                                customerEmail,
                                eventName,
                                quantity,
                                eventDate,
                                eventLocation
                            );
                        }
                    }
                }

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

using Api.Database;
using Api.Dtos.Validation;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchasedTicketController : ControllerBase{
        private readonly ApplicationDbContext _db;
        private readonly ITicketTokenValidationService _ticketTokenService;

        public PurchasedTicketController(ApplicationDbContext db,ITicketTokenValidationService ticketTokenService){
            _db=db;
            _ticketTokenService=ticketTokenService;
        }

        // GET: api/ticketvalidation/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetTicketToken(Guid id){
            var ticket=await _db.PurchasedTickets
                .FirstOrDefaultAsync(t => t.Id==id);
            
            if(ticket==null)
                return NotFound();

            var qrToken=_ticketTokenService.CreateToken(ticket.Id);

            return Ok(new {qrToken});
        }

        // GET: api/ticketvalidation/validate
        [Authorize]
        [HttpGet("validate")]
        public async Task<IActionResult> ValidateTicket([FromQuery] String token) {
            var staffUserIdValue=User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!Guid.TryParse(staffUserIdValue, out var staffUserId))
                return Unauthorized();

            var scannedAt=DateTime.UtcNow;
            if(!_ticketTokenService.ValidateToken(token,out var purchasedTicketId))
                return Ok(new TicketValidationDto{
                    Status="invalid",
                    Title="Invalid Ticket",
                    Message="This QR Code is not valid."
                });

            var ticket=await _db.PurchasedTickets
                .FirstOrDefaultAsync(t => t.Id==purchasedTicketId);

            if(ticket==null)
                return Ok(new TicketValidationDto{
                    Status="invalid",
                    Title="Invalid Ticket",
                    Message="This ticket was not found."
                });

            if(ticket.Status==PurchasedTicketStatus.Used)
                return Ok(new TicketValidationDto{
                    Status="already_used",
                    Title="Already Used",
                    Message="This ticket was already scanned.",
                    PurchasedTicketId=ticket.Id,
                    EventName=ticket.EventNameSnapshot,
                    TicketType=ticket.TicketTypeSnapshot,
                    Price=ticket.PriceSnapshot,
                    EventDate=ticket.EventDateSnapshot,
                    UsedAt=ticket.UsedAt
                });

            if(ticket.EventDateSnapshot<DateTime.UtcNow)
                return Ok(new TicketValidationDto{
                    Status="expired",
                    Title="Expired Ticket",
                    Message="This event has already passed.",
                    PurchasedTicketId=ticket.Id,
                    EventName=ticket.EventNameSnapshot,
                    TicketType=ticket.TicketTypeSnapshot,
                    Price=ticket.PriceSnapshot,
                    EventDate=ticket.EventDateSnapshot
                });

            ticket.Status=PurchasedTicketStatus.Used;
            ticket.UsedAt=scannedAt;
            ticket.UsedByStaffId=staffUserId;

            await _db.SaveChangesAsync();

            return Ok(new TicketValidationDto{
                Status="valid",
                Title="Valid Ticket",
                Message="Ticket accepted.",
                PurchasedTicketId=ticket.Id,
                EventName=ticket.EventNameSnapshot,
                TicketType=ticket.TicketTypeSnapshot,
                Price=ticket.PriceSnapshot,
                EventDate=ticket.EventDateSnapshot,
                UsedAt=ticket.UsedAt
            });
        }
    }
}

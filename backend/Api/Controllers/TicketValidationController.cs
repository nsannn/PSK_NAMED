using Api.Database;
using Api.Dtos.Validation;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketValidationController : ControllerBase{
        private readonly ApplicationDbContext _db;
        private readonly ITicketTokenValidationService _ticketTokenService;

        public TicketValidationController(ApplicationDbContext db,ITicketTokenValidationService ticketTokenService){
            _db=db;
            _ticketTokenService=ticketTokenService;
        }

        [HttpPost]
        public async Task<IActionResult> AddTicketToUser(){
            var ticket=new PurchasedTicket {
                Id=Guid.NewGuid(),
                UserId=Guid.Parse("3b7fc90e-8c14-433b-b8e5-206a83354d31"),
                EventId=Guid.Parse("e72ae151-dd87-4b1c-9605-fd5c5082bae8"),
                TicketId=Guid.Parse("1337c0dd-0bb6-4988-9437-f21a9d060c7d"),
                TicketTypeSnapshot="Standart",
                PriceSnapshot=5
            };

            _db.PurchasedTickets.Add(ticket);
            await _db.SaveChangesAsync();

            return StatusCode(201, new {
                message="Ticket created",
                id=ticket.Id
            });
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

        [HttpGet("validate")]
        public async Task<IActionResult> ValidateTicket([FromQuery] String token) {
            var scannedAt=DateTime.UtcNow;

            if(!_ticketTokenService.ValidateToken(token,out var purchasedTicketId))
                return Ok(new TicketValidationDto{
                    Status="invalid",
                    Title="Invalid Ticket",
                    Message="This QR Code is not valid."
                });

            var ticket=await _db.PurchasedTickets
                .Include(t => t.Event)
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
                    EventName=ticket.Event.Title,
                    TicketType=ticket.TicketTypeSnapshot,
                    Price=ticket.PriceSnapshot,
                    EventDate=ticket.Event.Date,
                    UsedAt=ticket.UsedAt
                });

            if(ticket.Event.Date<DateTime.UtcNow)
                return Ok(new TicketValidationDto{
                    Status="expired",
                    Title="Expired Ticket",
                    Message="This event has already passed.",
                    PurchasedTicketId=ticket.Id,
                    EventName=ticket.Event.Title,
                    TicketType=ticket.TicketTypeSnapshot,
                    Price=ticket.PriceSnapshot,
                    EventDate=ticket.Event.Date
                });

            ticket.Status=PurchasedTicketStatus.Used;
            ticket.UsedAt=scannedAt;

            await _db.SaveChangesAsync();

            return Ok(new TicketValidationDto{
                Status="valid",
                Title="Valid Ticket",
                Message="Ticket accepted.",
                PurchasedTicketId=ticket.Id,
                EventName=ticket.Event.Title,
                TicketType=ticket.TicketTypeSnapshot,
                Price=ticket.PriceSnapshot,
                EventDate=ticket.Event.Date,
                UsedAt=ticket.UsedAt
            });
        }
    }
}

using Api.Database;
using Api.Models;
using Api.Dtos.Event;
using Api.Dtos.Ticket;
using Api.Dtos.Tag;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public EventsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/events/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEvent(Guid id)
        {
            var ev = await _db.Events
                .Include(e => e.Tickets)
                .Include(e => e.Tags)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null)
                return NotFound();

            return Ok(MapToDto(ev));
        }
        
        // GET: api/events/myevents
        [HttpGet("myevents")]
        public async Task<IActionResult> GetMyEvents()
        {
            var events = await _db.Events
                .Include(e => e.Tickets)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            var result = events.Select(ev => 
            {
                var ticketsSold = ev.Tickets.Sum(t => t.Sold);
                var ticketsTotal = ev.Tickets.Sum(t => t.Quantity);
                var revenue = ev.Tickets.Sum(t => t.Sold * t.Price);
                var price = ev.Tickets.Any() ? ev.Tickets.Min(t => t.Price) : 0;

                return new MyEventDto
                {
                    Id = ev.Id,
                    Name = ev.Title,
                    Date = ev.Date.ToString("yyyy-MM-dd"), // Simplified formatting
                    Location = ev.Location,
                    Description = ev.Description,
                    TicketsSold = ticketsSold,
                    TicketsTotal = ticketsTotal,
                    Revenue = revenue.ToString("N2"),
                    Price = price
                };
            });

            return Ok(result);
        }

        // POST: api/events
        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ev = new Event
            {
                Id = Guid.NewGuid(),
                Title = createDto.Title,
                Description = createDto.Description,
                Location = createDto.Location,
                Date = createDto.Date.ToUniversalTime(),
                Tickets = createDto.TicketTiers.Select(t => new Ticket
                {
                    Id = Guid.NewGuid(),
                    Type = t.Name,
                    Quantity = t.Quantity,
                    Sold = 0,
                    Price = t.Price
                }).ToList()
            };
            
            var allTagNames = new List<string>(createDto.Tags);
            if (!string.IsNullOrEmpty(createDto.EventType))
            {
                allTagNames.Add(createDto.EventType);
            }
            allTagNames = allTagNames.Distinct().ToList();

            foreach(var tagName in allTagNames)
            {
                var existingTag = await _db.Tags.FirstOrDefaultAsync(t => t.Name.ToLower() == tagName.ToLower());
                if (existingTag == null)
                {
                    existingTag = new Tag { Id = Guid.NewGuid(), Name = tagName };
                    _db.Tags.Add(existingTag);
                }
                ev.Tags.Add(existingTag);
            }

            _db.Events.Add(ev);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEvent), new { id = ev.Id }, MapToDto(ev));
        }

        // Helper
        private static EventDto MapToDto(Event ev) => new()
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            Location = ev.Location,
            Date = ev.Date,

            Tags = ev.Tags.Select(t => new TagDto
            {
                Id = t.Id,
                Name = t.Name
            }).ToList(),

            Tickets = ev.Tickets.Select(t => new TicketDto
            {
                Id = t.Id,
                Type = t.Type,
                Quantity = t.Quantity,
                Sold = t.Sold,
                Price = t.Price
            }).ToList()
        };
    }
}
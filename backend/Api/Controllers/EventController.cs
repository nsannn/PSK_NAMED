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
                Price = t.Price
            }).ToList()
        };
    }
}
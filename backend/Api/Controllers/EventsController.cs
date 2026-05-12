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
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<EventsController> _logger;

        public EventsController(ApplicationDbContext db, IWebHostEnvironment env, ILogger<EventsController> logger)
        {
            _db = db;
            _env = env;
            _logger = logger;
        }

        private string PostersDir => Path.Combine(_env.ContentRootPath, "Posters");

        private bool EventHasPoster(Guid id) =>
            Directory.Exists(PostersDir) &&
            Directory.EnumerateFiles(PostersDir, id + ".*").Any();

        // GET: api/events/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetEvent(Guid id)
        {
            var ev = await _db.Events
                .Include(e => e.Tickets)
                .Include(e => e.Tags)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null)
                return NotFound();

            return Ok(MapToDto(ev, EventHasPoster(ev.Id)));
        }

        // GET: api/events/{id}/poster
        [HttpGet("{id:guid}/poster")]
        public async Task<IActionResult> GetPoster(Guid id)
        {
            if (!Directory.Exists(PostersDir))
                return NotFound();

            var file = Directory.EnumerateFiles(PostersDir, id + ".*").FirstOrDefault();
            if (file == null)
                return NotFound();

            var ext = Path.GetExtension(file).ToLowerInvariant();
            var contentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png"            => "image/png",
                ".webp"           => "image/webp",
                _                 => "application/octet-stream"
            };

            var bytes = await System.IO.File.ReadAllBytesAsync(file);
            return File(bytes, contentType);
        }

        // POST: api/events/{id}/poster
        [HttpPost("{id:guid}/poster")]
        public async Task<IActionResult> UploadPoster(Guid id, IFormFile file)
        {
            var ev = await _db.Events.FindAsync(id);
            if (ev == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
                return BadRequest(new { message = "Only JPG, PNG, and WebP images are allowed." });

            Directory.CreateDirectory(PostersDir);

            foreach (var existing in Directory.EnumerateFiles(PostersDir, id + ".*"))
                System.IO.File.Delete(existing);

            var filePath = Path.Combine(PostersDir, id + ext);
            await using var stream = System.IO.File.Create(filePath);
            await file.CopyToAsync(stream);

            return Ok(new { url = $"/api/events/{id}/poster" });
        }

        // GET: api/events/myevents
        [HttpGet("myevents")]
        public async Task<IActionResult> GetMyEvents(
            [FromQuery] string? search,
            [FromQuery] string? eventType,
            [FromQuery] string? tags,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? dateFrom,
            [FromQuery] string? dateTo,
            [FromQuery] string? location,
            [FromQuery] string? sort)
        {
            var query = _db.Events
                .Include(e => e.Tickets)
                .Include(e => e.Tags)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(e =>
                    e.Title.ToLower().Contains(search.ToLower()) ||
                    e.Description.ToLower().Contains(search.ToLower()));

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(e => e.Location.ToLower().Contains(location.ToLower()));

            if (!string.IsNullOrWhiteSpace(eventType))
                query = query.Where(e => e.Tags.Any(t => t.Name.ToLower() == eventType.ToLower()));

            if (!string.IsNullOrWhiteSpace(tags))
            {
                foreach (var tag in tags.Split(',').Select(t => t.Trim().ToLower()).Where(t => t.Length > 0))
                {
                    var captured = tag;
                    query = query.Where(e => e.Tags.Any(t => t.Name.ToLower() == captured));
                }
            }

            if (minPrice.HasValue)
                query = query.Where(e => e.Tickets.Any(t => t.Price >= minPrice.Value));

            if (maxPrice.HasValue)
                query = query.Where(e => e.Tickets.Any(t => t.Price <= maxPrice.Value));

            if (DateTime.TryParse(dateFrom, out var from))
                query = query.Where(e => e.Date >= from.ToUniversalTime());

            if (DateTime.TryParse(dateTo, out var to))
                query = query.Where(e => e.Date <= to.ToUniversalTime().AddDays(1));

            query = sort switch
            {
                "oldest"     => query.OrderBy(e => e.Date),
                "price-asc"  => query.OrderBy(e => e.Tickets.Min(t => (decimal?)t.Price)),
                "price-desc" => query.OrderByDescending(e => e.Tickets.Min(t => (decimal?)t.Price)),
                "name-asc"   => query.OrderBy(e => e.Title),
                "name-desc"  => query.OrderByDescending(e => e.Title),
                _            => query.OrderByDescending(e => e.Date)
            };

            var events = await query.ToListAsync();

            var result = events.Select(ev =>
            {
                var ticketsSold  = ev.Tickets.Sum(t => t.Sold);
                var ticketsTotal = ev.Tickets.Sum(t => t.Quantity);
                var revenue      = ev.Tickets.Sum(t => t.Sold * t.Price);
                var price        = ev.Tickets.Any() ? ev.Tickets.Min(t => t.Price) : 0;

                return new MyEventDto
                {
                    Id            = ev.Id,
                    Name          = ev.Title,
                    Date          = ev.Date.ToString("yyyy-MM-dd"),
                    Location      = ev.Location,
                    Description   = ev.Description,
                    TicketsSold   = ticketsSold,
                    TicketsTotal  = ticketsTotal,
                    Revenue       = revenue.ToString("N2"),
                    RevenueAmount = revenue,
                    Price         = price,
                    HasPoster     = EventHasPoster(ev.Id)
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
                allTagNames.Add(createDto.EventType);
            allTagNames = allTagNames.Distinct().ToList();

            foreach (var tagName in allTagNames)
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

            return CreatedAtAction(nameof(GetEvent), new { id = ev.Id }, MapToDto(ev, false));
        }

        // PUT: api/events/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ev = await _db.Events
                .Include(e => e.Tickets)
                .Include(e => e.Tags)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null)
                return NotFound();

            ev.Title = updateDto.Title;
            ev.Description = updateDto.Description;
            ev.Location = updateDto.Location;
            ev.Date = updateDto.Date.ToUniversalTime();

            await _db.Tickets.Where(t => t.EventId == id).ExecuteDeleteAsync();

            foreach (var tierDto in updateDto.TicketTiers)
            {
                _db.Tickets.Add(new Ticket
                {
                    Id = Guid.NewGuid(),
                    EventId = id,
                    Type = tierDto.Name,
                    Quantity = tierDto.Quantity,
                    Sold = 0,
                    Price = tierDto.Price
                });
            }

            var allTagNames = new List<string>(updateDto.Tags);
            if (!string.IsNullOrEmpty(updateDto.EventType))
                allTagNames.Add(updateDto.EventType);
            allTagNames = allTagNames.Distinct().ToList();

            var desiredTags = new List<Tag>();
            foreach (var tagName in allTagNames)
            {
                var existingTag = await _db.Tags.FirstOrDefaultAsync(t => t.Name.ToLower() == tagName.ToLower());
                if (existingTag == null)
                {
                    existingTag = new Tag { Id = Guid.NewGuid(), Name = tagName };
                    _db.Tags.Add(existingTag);
                }
                desiredTags.Add(existingTag);
            }

            var desiredTagIds = desiredTags.Select(t => t.Id).ToHashSet();
            foreach (var tag in ev.Tags.Where(t => !desiredTagIds.Contains(t.Id)).ToList())
                ev.Tags.Remove(tag);

            var currentTagIds = ev.Tags.Select(t => t.Id).ToHashSet();
            foreach (var tag in desiredTags.Where(t => !currentTagIds.Contains(t.Id)))
                ev.Tags.Add(tag);

            try
            {
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict updating event {EventId}", id);
                return Conflict(new { message = "Event was modified or deleted by another user" });
            }
        }

        // DELETE: api/events/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var ev = await _db.Events.FindAsync(id);
            if (ev == null)
                return NotFound();

            // Remove poster file if it exists
            if (Directory.Exists(PostersDir))
                foreach (var f in Directory.EnumerateFiles(PostersDir, id + ".*"))
                    System.IO.File.Delete(f);

            _db.Events.Remove(ev);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private static EventDto MapToDto(Event ev, bool hasPoster) => new()
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            Location = ev.Location,
            Date = ev.Date,
            HasPoster = hasPoster,

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

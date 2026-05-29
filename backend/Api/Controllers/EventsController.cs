using Api.Database;
using Api.Models;
using Api.Dtos.Event;
using Api.Dtos.Ticket;
using Api.Dtos.Tag;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

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
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpPost("{id:guid}/poster")]
        public async Task<IActionResult> UploadPoster(Guid id, [FromForm] IFormFile file, [FromForm] uint version, [FromForm] bool forceOverwrite = false)
        {
            var ev = await _db.Events.FindAsync(id);
            if (ev == null)
                return NotFound();

            // Managers can only upload posters for their own events
            var uploaderIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var uploaderId = string.IsNullOrEmpty(uploaderIdStr) ? Guid.Empty : Guid.Parse(uploaderIdStr);
            if (User.IsInRole("Manager") && ev.CreatedByUserId != uploaderId)
                return Forbid();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
                return BadRequest(new { message = "Only JPG, PNG, and WebP images are allowed." });

            if (!forceOverwrite)
            {
                _db.Entry(ev)
                    .Property(e => e.Version)
                    .OriginalValue = version;
            }

            Directory.CreateDirectory(PostersDir);

            foreach (var existing in Directory.EnumerateFiles(PostersDir, id + ".*"))
                System.IO.File.Delete(existing);

            var filePath = Path.Combine(PostersDir, id + ext);
            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            try {
                TouchEvent(ev);
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)            {
                _logger.LogWarning(ex, "Concurrency conflict uploading poster for event {EventId}", id);
                
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);
                
                var current = await _db.Events
                    .Include(e => e.Tickets)
                    .Include(e => e.Tags)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == id);

                return Conflict(new
                {
                    message = "Event was modified or deleted by another user",
                    currentData = current == null ? null : MapToDto(current, EventHasPoster(current.Id))
                });
            }

            return Ok(new { url = $"/api/events/{id}/poster", version = ev.Version });
        }

        // GET: api/events/myevents
        // Unified endpoint for all roles:
        //   - Customer/Validator/Anonymous: browse all events (no stats)
        //   - Manager: only their owned events (with stats)
        //   - SuperAdmin: all events (with stats)
        [AllowAnonymous]
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
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr);
            var role = User.FindFirstValue(ClaimTypes.Role);

            var isManager    = role == "Manager";
            var isSuperAdmin = role == "SuperAdmin";
            var canManage    = isManager || isSuperAdmin;

            var query = _db.Events
                .Include(e => e.Tickets)
                .Include(e => e.Tags)
                .AsQueryable();

            // Managers only see their own events
            if (isManager)
            {
                query = query.Where(e => e.CreatedByUserId == userId);
            }

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
                    // Only expose stats to Manager/SuperAdmin
                    TicketsSold   = canManage ? ticketsSold : 0,
                    TicketsTotal  = canManage ? ticketsTotal : 0,
                    Revenue       = canManage ? revenue.ToString("N2") : "0.00",
                    RevenueAmount = canManage ? revenue : 0,
                    Price         = price,
                    HasPoster     = EventHasPoster(ev.Id),
                    Tiers         = ev.Tickets.Select(t => new MyEventTierDto
                    {
                        Name     = t.Type,
                        Quantity = t.Quantity,
                        Sold     = t.Sold
                    }).ToList()
                };
            });

            return Ok(result);
        }

        // POST: api/events
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr);

            var ev = new Event
            {
                Id = Guid.NewGuid(),
                CreatedByUserId = userId == Guid.Empty ? null : userId,
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
        [Authorize(Roles = "Manager,SuperAdmin")]
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

            // Managers can only edit their own events
            var editorIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var editorId = string.IsNullOrEmpty(editorIdStr) ? Guid.Empty : Guid.Parse(editorIdStr);
            if (User.IsInRole("Manager") && ev.CreatedByUserId != editorId)
                return Forbid();

            if (!updateDto.ForceOverwrite && ev.Version != updateDto.Version)
            {
                _logger.LogWarning("Concurrency conflict updating event {EventId}: client version {ClientVersion} != db version {DbVersion}",
                    id, updateDto.Version, ev.Version);

                var currentData = await _db.Events
                    .Include(e => e.Tickets)
                    .Include(e => e.Tags)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == id);

                return Conflict(new
                {
                    message = "Event was modified or deleted by another user",
                    currentData = currentData == null ? null : MapToDto(currentData, EventHasPoster(currentData.Id))
                });
            }

            ev.Title = updateDto.Title;
            ev.Description = updateDto.Description;
            ev.Location = updateDto.Location;
            ev.Date = updateDto.Date.ToUniversalTime();

            var incomingTicketIds = updateDto.TicketTiers.Where(t => t.Id.HasValue).Select(t => t.Id.Value).ToList();
            
            var ticketsToDelete = ev.Tickets.Where(t => !incomingTicketIds.Contains(t.Id)).ToList();
            if (ticketsToDelete.Any(t => t.Sold > 0)) {
                return BadRequest(new { message = "Cannot delete a ticket tier that has already sold tickets." });
            }

            foreach (var tierDto in updateDto.TicketTiers.Where(t => t.Id.HasValue)) {
                var existing = ev.Tickets.FirstOrDefault(t => t.Id == tierDto.Id.Value);
                if (existing != null && tierDto.Quantity < existing.Sold) {
                    return BadRequest(new { message = $"Cannot reduce quantity of '{existing.Type}' below tickets already sold ({existing.Sold})." });
                }
            }

            _db.Tickets.RemoveRange(ticketsToDelete);

            foreach (var tierDto in updateDto.TicketTiers) {
                if (tierDto.Id.HasValue) {
                    var existing = ev.Tickets.FirstOrDefault(t => t.Id == tierDto.Id.Value);
                    if (existing != null) {
                        existing.Type = tierDto.Name;
                        existing.Quantity = tierDto.Quantity;
                        existing.Price = tierDto.Price;
                    } else {
                        _db.Tickets.Add(new Ticket {
                            Id = Guid.NewGuid(),
                            EventId = id,
                            Type = tierDto.Name,
                            Quantity = tierDto.Quantity,
                            Sold = 0,
                            Price = tierDto.Price
                        });
                    }
                } else {
                    _db.Tickets.Add(new Ticket {
                        Id = Guid.NewGuid(),
                        EventId = id,
                        Type = tierDto.Name,
                        Quantity = tierDto.Quantity,
                        Sold = 0,
                        Price = tierDto.Price
                    });
                }
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
                
                // Re-read to get the new xmin/Version after save
                await _db.Entry(ev).ReloadAsync();
                
                var updatedEvent = MapToDto(ev, EventHasPoster(ev.Id));
                return Ok(updatedEvent);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict updating event {EventId}", id);

                var current = await _db.Events
                    .Include(e => e.Tickets)
                    .Include(e => e.Tags)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == id);

                return Conflict(new
                {
                    message = "Event was modified or deleted by another user",
                    currentData = current == null ? null : MapToDto(current, EventHasPoster(current.Id))
                });
            }
        }

        // DELETE: api/events/{id}
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var ev = await _db.Events.FindAsync(id);
            if (ev == null)
                return NotFound();

            // Managers can only delete their own events
            var deleterIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var deleterId = string.IsNullOrEmpty(deleterIdStr) ? Guid.Empty : Guid.Parse(deleterIdStr);
            if (User.IsInRole("Manager") && ev.CreatedByUserId != deleterId)
                return Forbid();

            // Remove poster file if it exists
            if (Directory.Exists(PostersDir))
                foreach (var f in Directory.EnumerateFiles(PostersDir, id + ".*"))
                    System.IO.File.Delete(f);

            _db.Events.Remove(ev);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // Touch the event to update its concurrency token
        private void TouchEvent(Event ev)
        {
            _db.Entry(ev).Property(e => e.Title).IsModified = true;
        }

        private static EventDto MapToDto(Event ev, bool hasPoster) => new()
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            Location = ev.Location,
            Date = ev.Date,
            Version = ev.Version,
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

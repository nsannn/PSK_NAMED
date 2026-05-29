using Api.Database;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api")]
    public class ValidatorsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ValidatorsController(ApplicationDbContext db)
        {
            _db = db;
        }

        private bool CanManageEvent(Event ev)
        {
            if (User.IsInRole("SuperAdmin"))
                return true;

            if (!User.IsInRole("Manager"))
                return false;

            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(currentUserIdStr, out var currentUserId) && ev.CreatedByUserId == currentUserId;
        }

        // GET: api/users/validators
        // Gets all users who have the Validator role.
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpGet("users/validators")]
        public async Task<IActionResult> GetAllValidators()
        {
            var validators = await _db.Users
                .Where(u => u.Role == UserRole.Validator)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email
                })
                .ToListAsync();

            return Ok(validators);
        }

        // GET: api/events/{eventId}/validators
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpGet("events/{eventId:guid}/validators")]
        public async Task<IActionResult> GetAssignedValidators(Guid eventId)
        {
            var ev = await _db.Events
                .Include(e => e.AssignedValidators)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (ev == null)
                return NotFound();

            if (!CanManageEvent(ev))
                return Forbid();

            var validators = ev.AssignedValidators.Select(v => new
            {
                v.Id,
                v.FirstName,
                v.LastName,
                v.Email
            });

            return Ok(validators);
        }

        // POST: api/events/{eventId}/validators/{userId}
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpPost("events/{eventId:guid}/validators/{userId:guid}")]
        public async Task<IActionResult> AssignValidator(Guid eventId, Guid userId)
        {
            var ev = await _db.Events
                .Include(e => e.AssignedValidators)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (ev == null) return NotFound("Event not found");

            if (!CanManageEvent(ev))
                return Forbid();

            var validator = await _db.Users.FindAsync(userId);
            if (validator == null || validator.Role != UserRole.Validator)
                return BadRequest("User is not a validator");

            if (!ev.AssignedValidators.Any(v => v.Id == userId))
            {
                ev.AssignedValidators.Add(validator);
                await _db.SaveChangesAsync();
            }

            return Ok(new { message = "Validator assigned" });
        }

        // DELETE: api/events/{eventId}/validators/{userId}
        [Authorize(Roles = "Manager,SuperAdmin")]
        [HttpDelete("events/{eventId:guid}/validators/{userId:guid}")]
        public async Task<IActionResult> RemoveValidator(Guid eventId, Guid userId)
        {
            var ev = await _db.Events
                .Include(e => e.AssignedValidators)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (ev == null) return NotFound("Event not found");

            if (!CanManageEvent(ev))
                return Forbid();

            var validator = ev.AssignedValidators.FirstOrDefault(v => v.Id == userId);
            if (validator != null)
            {
                ev.AssignedValidators.Remove(validator);
                await _db.SaveChangesAsync();
            }

            return Ok(new { message = "Validator removed" });
        }

        // GET: api/events/validator-assigned
        // Gets events assigned to the logged-in validator that happen Yesterday, Today, or Tomorrow.
        [Authorize(Roles = "Validator")]
        [HttpGet("events/validator-assigned")]
        [HttpGet("validators/my-events")]
        public async Task<IActionResult> GetMyValidatorEvents()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);
            var tomorrow = today.AddDays(1);

            var events = await _db.Events
                .Include(e => e.AssignedValidators)
                .Where(e => e.AssignedValidators.Any(v => v.Id == userId))
                .Where(e => e.Date.Date >= yesterday && e.Date.Date <= tomorrow)
                .OrderBy(e => e.Date)
                .ToListAsync();

            var postersDir = Path.Combine(Directory.GetCurrentDirectory(), "Posters");

            var result = events.Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.Location,
                e.Date,
                HasPoster = Directory.Exists(postersDir) && Directory.EnumerateFiles(postersDir, e.Id + ".*").Any()
            });

            return Ok(result);
        }
    }
}

using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Api.Controllers;
using Api.Database;
using Api.Models;
using Api.Dtos.Event;

namespace Api.Tests.Controllers
{
    public class EventsControllerTests : IDisposable
    {
        private readonly string _tempDir;

        public EventsControllerTests()
        {
            _tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(_tempDir);
        }

        public void Dispose()
        {
            if (Directory.Exists(_tempDir))
                Directory.Delete(_tempDir, true);
        }

        private EventsController CreateController(ApplicationDbContext db)
        {
            var envMock = new Mock<IWebHostEnvironment>();
            envMock.Setup(e => e.ContentRootPath).Returns(_tempDir);
            var logger = Mock.Of<ILogger<EventsController>>();

            return new EventsController(db, envMock.Object, logger);
        }

        private ApplicationDbContext CreateDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task GetEvent_ReturnsNotFound_WhenEventDoesNotExist()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());
            var controller = CreateController(db);

            var result = await controller.GetEvent(Guid.NewGuid());

            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task GetEvent_ReturnsEvent_WhenEventExists()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());
            var evId = Guid.NewGuid();

            db.Events.Add(new Event
            {
                Id = evId,
                Title = "Test Event",
                Description = "Test Description",
                Date = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);

            var result = await controller.GetEvent(evId);
            var okResult = result as OkObjectResult;

            okResult.Should().NotBeNull();
            okResult!.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateEvent_CreatesEvent()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());

            var controller = CreateController(db);

            var dto = new CreateEventDto
            {
                Title = "New Event",
                Description = "Description",
                Location = "Venue",
                Date = DateTime.UtcNow,
                EventType = "Outdoors",
                TicketTiers = new List<Dtos.Event.CreateTicketTierDto>
                {
                    new CreateTicketTierDto { Name = "VIP", Quantity = 10, Price = 50 }
                },
                Tags = new List<string>()
            };

            var result = await controller.CreateEvent(dto);

            var createdResult = result as CreatedAtActionResult;
            createdResult.Should().NotBeNull();
            db.Events.Any(e => e.Title == "New Event").Should().BeTrue();
        }

        [Fact]
        public async Task UpdateEvent_UpdatesEvent()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());
            var evId = Guid.NewGuid();

            db.Events.Add(new Event
            {
                Id = evId,
                Title = "Old Title",
                Description = "Old Desc",
                Date = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);

            var updateDto = new UpdateEventDto
            {
                Title = "New Title",
                Description = "New Desc",
                Location = "New Location",
                Date = DateTime.UtcNow,
                TicketTiers = new List<CreateTicketTierDto>(),
                Tags = new List<string>()
            };

            var result = await controller.UpdateEvent(evId, updateDto);
            result.Should().BeOfType<NoContentResult>();
            db.Events.First(e => e.Id == evId).Title.Should().Be("New Title");
        }

        [Fact]
        public async Task DeleteEvent_DeletesEventAndPoster()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());
            var evId = Guid.NewGuid();

            db.Events.Add(new Event
            {
                Id = evId,
                Title = "To Delete",
                Date = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            // create fake poster
            var posterDir = Path.Combine(_tempDir, "Posters");
            Directory.CreateDirectory(posterDir);
            var posterFile = Path.Combine(posterDir, evId + ".jpg");
            await File.WriteAllTextAsync(posterFile, "fake");

            var controller = CreateController(db);

            var result = await controller.DeleteEvent(evId);
            result.Should().BeOfType<NoContentResult>();
            db.Events.Any(e => e.Id == evId).Should().BeFalse();
            File.Exists(posterFile).Should().BeFalse();
        }

        [Fact]
        public async Task UploadPoster_SavesFile()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());
            var evId = Guid.NewGuid();

            db.Events.Add(new Event
            {
                Id = evId,
                Title = "Poster Event",
                Date = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var controller = CreateController(db);

            // Mock file
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("poster.jpg");
            fileMock.Setup(f => f.Length).Returns(1);
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns<Stream, System.Threading.CancellationToken>((s, t) => Task.CompletedTask);

            var result = await controller.UploadPoster(evId, fileMock.Object);
            result.Should().BeOfType<OkObjectResult>();

            var posterPath = Directory.EnumerateFiles(Path.Combine(_tempDir, "Posters"), evId + ".*").FirstOrDefault();
            posterPath.Should().NotBeNull();
        }

        [Fact]
        public async Task GetPoster_ReturnsFileOrNotFound()
        {
            await using var db = CreateDb(Guid.NewGuid().ToString());
            var evId = Guid.NewGuid();

            db.Events.Add(new Event { Id = evId, Title = "Poster Event", Date = DateTime.UtcNow });
            await db.SaveChangesAsync();

            var posterDir = Path.Combine(_tempDir, "Posters");
            Directory.CreateDirectory(posterDir);
            var posterFile = Path.Combine(posterDir, evId + ".jpg");
            await File.WriteAllTextAsync(posterFile, "fake");

            var controller = CreateController(db);

            var result = await controller.GetPoster(evId);
            result.Should().BeOfType<FileContentResult>();

            var resultNotFound = await controller.GetPoster(Guid.NewGuid());
            resultNotFound.Should().BeOfType<NotFoundResult>();
        }
    }
}
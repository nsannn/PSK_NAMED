using System.Security.Claims;
using System.Text;
using Api.Controllers;
using Api.Database;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace Api.Tests.Controllers
{
    public class CheckoutControllerTests
    {
        private ApplicationDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private CheckoutController GetController(ApplicationDbContext db, IEmailService emailService, IConfiguration config)
        {
            var logger = Mock.Of<ILogger<CheckoutController>>();
            var tokenService = Mock.Of<ITicketTokenValidationService>();
            var controller = new CheckoutController(db, emailService, config, logger, tokenService);

            // Mock authenticated user
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-123"),
                new Claim(ClaimTypes.Email, "test@example.com")
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        [Fact]
        public async Task CreateSession_InvalidQuantity_ReturnsBadRequest()
        {
            // Arrange
            var db = GetDbContext();
            var emailService = Mock.Of<IEmailService>();
            var config = Mock.Of<IConfiguration>();
            var controller = GetController(db, emailService, config);

            var request = new CreateCheckoutSessionRequest
            {
                Tickets = new List<SessionReqTicket> { new SessionReqTicket { TicketId = Guid.NewGuid(), Quantity = 0 } },
                EventId = Guid.NewGuid()
            };

            // Act
            var result = await controller.CreateSession(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var badRequest = result as BadRequestObjectResult;
            badRequest!.Value.Should().BeEquivalentTo(new { message = "Quantity must be between 1 and 10." });
        }

        [Fact]
        public async Task CreateSession_EventNotFound_ReturnsNotFound()
        {
            // Arrange
            var db = GetDbContext();
            var emailService = Mock.Of<IEmailService>();
            var config = Mock.Of<IConfiguration>();
            var controller = GetController(db, emailService, config);

            var request = new CreateCheckoutSessionRequest
            {
                Tickets = new List<SessionReqTicket> { new SessionReqTicket { TicketId = Guid.NewGuid(), Quantity = 1 } },
                EventId = Guid.NewGuid()
            };

            // Act
            var result = await controller.CreateSession(request);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
            var notFound = result as NotFoundObjectResult;
            notFound!.Value.Should().BeEquivalentTo(new { message = "Event not found." });
        }

        [Fact]
        public async Task SessionStatus_MissingSessionId_ReturnsBadRequest()
        {
            // Arrange
            var db = GetDbContext();
            var emailService = Mock.Of<IEmailService>();
            var config = Mock.Of<IConfiguration>();
            var controller = GetController(db, emailService, config);

            // Act
            var result = await controller.SessionStatus("");

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var badRequest = result as BadRequestObjectResult;
            badRequest!.Value.Should().BeEquivalentTo(new { message = "sessionId is required." });
        }

        [Fact]
        public async Task Webhook_InvalidJson_ReturnsBadRequest()
        {
            // Arrange
            var db = GetDbContext();
            var emailService = Mock.Of<IEmailService>();
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["STRIPE_WEBHOOK_SECRET"]).Returns("secret");

            var controller = GetController(db, emailService, configMock.Object);

            var context = new DefaultHttpContext();
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("invalid json"));
            context.Request.Headers["Stripe-Signature"] = "signature";

            controller.ControllerContext.HttpContext = context;

            // Act
            var result = await controller.Webhook();

            // Assert
            result.Should().BeOfType<BadRequestResult>();
        }
    }
}
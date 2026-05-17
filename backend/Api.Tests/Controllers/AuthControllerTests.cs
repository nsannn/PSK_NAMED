using Api.Controllers;
using Api.Database;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace Api.Tests.Controllers
{
    public class AuthControllerTests
    {
        private ApplicationDbContext GetInMemoryDb()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private AuthController GetController(ApplicationDbContext db)
        {
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["JWT_SECRET"]).Returns("ThisIsALongEnoughTestSecretKey12345!");
            var logger = Mock.Of<ILogger<AuthController>>();

            var controller = new AuthController(db, configMock.Object, logger);

            // Needed for cookie setting
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            return controller;
        }

        [Fact]
        public async Task Register_CreatesUserSuccessfully()
        {
            // Arrange
            var db = GetInMemoryDb();
            var controller = GetController(db);

            var req = new RegisterRequest
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                Password = "Password123",
                ConfirmPassword = "Password123",
                Role = "Customer"
            };

            // Act
            var result = await controller.Register(req);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var ok = result as OkObjectResult;
            ok!.Value.Should().NotBeNull();
            db.Users.Should().ContainSingle(u => u.Email == "john@example.com");
        }

        [Fact]
        public async Task Register_ReturnsConflict_WhenEmailExists()
        {
            // Arrange
            var db = GetInMemoryDb();
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                Role = UserRole.Customer,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var controller = GetController(db);

            var req = new RegisterRequest
            {
                FirstName = "Jane",
                LastName = "Doe",
                Email = "jane@example.com",
                Password = "Password123",
                ConfirmPassword = "Password123",
                Role = "Customer"
            };

            // Act
            var result = await controller.Register(req);

            // Assert
            result.Should().BeOfType<ConflictObjectResult>();
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenPasswordsDontMatch()
        {
            // Arrange
            var db = GetInMemoryDb();
            var controller = GetController(db);

            var req = new RegisterRequest
            {
                FirstName = "Alice",
                LastName = "Wonder",
                Email = "alice@example.com",
                Password = "Password123",
                ConfirmPassword = "WrongPassword",
                Role = "Customer"
            };

            // Act
            var result = await controller.Register(req);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Login_ReturnsOk_WhenCredentialsAreValid()
        {
            // Arrange
            var db = GetInMemoryDb();
            var password = "Password123";
            var hashed = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Bob",
                LastName = "Builder",
                Email = "bob@example.com",
                PasswordHash = hashed,
                Role = UserRole.Customer,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var controller = GetController(db);

            var req = new LoginRequest
            {
                Email = "bob@example.com",
                Password = password
            };

            // Act
            var result = await controller.Login(req);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var ok = result as OkObjectResult;
            ok!.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenCredentialsAreInvalid()
        {
            // Arrange
            var db = GetInMemoryDb();
            var controller = GetController(db);

            var req = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "Password123"
            };

            // Act
            var result = await controller.Login(req);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Fact]
        public void Logout_DeletesCookieAndReturnsOk()
        {
            // Arrange
            var db = GetInMemoryDb();
            var controller = GetController(db);

            // Add a dummy cookie
            controller.Response.Cookies.Append("jwt", "testtoken");

            // Act
            var result = controller.Logout();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            controller.Response.Headers["Set-Cookie"].ToString().Should().Contain("jwt=;"); // Expired cookie
        }
    }
}
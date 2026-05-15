using Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace Api.Tests.Controllers
{
    public class LogsControllerTests
    {
        private LogsController GetController(Mock<ILogger<LogsController>> loggerMock)
        {
            return new LogsController(loggerMock.Object);
        }

        [Fact]
        public void ReceiveClientLog_WithErrorLevel_LogsErrorAndReturnsOk()
        {
            // Arrange
            var loggerMock = new Mock<ILogger<LogsController>>();
            var controller = GetController(loggerMock);

            object? capturedState = null;
            loggerMock
                .Setup(l => l.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
                .Callback(new InvocationAction (invocation =>
                {
                    // Capture the third parameter (state)
                    capturedState = invocation.Arguments[2];
                }));

            var logEntry = new LogsController.ClientLogEntry
            {
                Level = "error",
                Message = "Something went wrong",
                Url = "/test/page",
                Stack = "StackTraceHere"
            };

            // Act
            var result = controller.ReceiveClientLog(logEntry);

            // Assert
            result.Should().BeOfType<OkResult>();

            // Check the message
            capturedState.Should().NotBeNull();
            capturedState.ToString().Should().Contain("Something went wrong");
            capturedState.ToString().Should().Contain("/test");
            capturedState.ToString().Should().Contain("StackTraceHere");

            // Verify logger was called with LogLevel.Error
            loggerMock.Verify(
                l => l.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    null,
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public void ReceiveClientLog_WithWarningLevel_LogsWarningAndReturnsOk()
        {
            // Arrange
            var loggerMock = new Mock<ILogger<LogsController>>();
            var controller = GetController(loggerMock);

            var logEntry = new LogsController.ClientLogEntry
            {
                Level = "warn",
                Message = "This is a warning"
            };

            // Act
            var result = controller.ReceiveClientLog(logEntry);

            // Assert
            result.Should().BeOfType<OkResult>();

            loggerMock.Verify(
                l => l.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    null,
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public void ReceiveClientLog_WithInfoLevel_LogsInformationAndReturnsOk()
        {
            // Arrange
            var loggerMock = new Mock<ILogger<LogsController>>();
            var controller = GetController(loggerMock);

            var logEntry = new LogsController.ClientLogEntry
            {
                Level = "info",
                Message = "Just some info"
            };

            // Act
            var result = controller.ReceiveClientLog(logEntry);

            // Assert
            result.Should().BeOfType<OkResult>();

            loggerMock.Verify(
                l => l.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    null,
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public void ReceiveClientLog_WithNullOptionalFields_UsesDefaults()
        {
            // Arrange
            var loggerMock = new Mock<ILogger<LogsController>>();
            var controller = GetController(loggerMock);

            object? capturedState = null;
            loggerMock
                .Setup(l => l.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
                .Callback(new InvocationAction (invocation =>
                {
                    // Capture the third parameter (state)
                    capturedState = invocation.Arguments[2];
                }));

            var logEntry = new LogsController.ClientLogEntry
            {
                Level = "error",
                Message = "Error with nulls",
                Url = null,
                Stack = null,
                UserAgent = null
            };

            // Act
            var result = controller.ReceiveClientLog(logEntry);

            // Assert
            result.Should().BeOfType<OkResult>();

            // Check the message
            capturedState.Should().NotBeNull();
            capturedState.ToString().Should().Contain("Error with nulls");
            capturedState.ToString().Should().Contain("URL: unknown");
            capturedState.ToString().Should().Contain("Stack: none");

            loggerMock.Verify(
                l => l.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    null,
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }
    }
}
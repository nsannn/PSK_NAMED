using Api.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Middleware
{
    public class ErrorHandlingMiddlewareTests
    {
        [Fact]
        public async Task Middleware_Returns500_WhenExceptionThrown()
        {
            // Arrange
            var context = new DefaultHttpContext();
        
            RequestDelegate next = (ctx) =>
            {
                throw new Exception("boom");
            };
        
            var logger = Mock.Of<ILogger<ErrorHandlingMiddleware>>();
            var envMock = new Mock<IHostEnvironment>();
            envMock.Setup(e => e.EnvironmentName).Returns("Production");
            
            var env = envMock.Object;
        
            var middleware = new ErrorHandlingMiddleware(next, logger, env);
        
            // Act
            await middleware.InvokeAsync(context);
        
            // Assert
            context.Response.StatusCode.Should().Be(500);
        }
    }
}
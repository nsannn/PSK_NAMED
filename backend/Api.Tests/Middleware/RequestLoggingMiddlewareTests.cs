using Api.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Middleware
{
    public class RequestLoggingMiddlewareTests
    {
        [Fact]
        public async Task Middleware_AddsCorrelationIdHeader()
        {
            // Arrange
            var context = new DefaultHttpContext();
        
            RequestDelegate next = (ctx) =>
            {
                ctx.Response.StatusCode = 200;
                return Task.CompletedTask;
            };
        
            var logger = Mock.Of<ILogger<RequestLoggingMiddleware>>();
        
            var middleware = new RequestLoggingMiddleware(next, logger);
        
            // Act
            await middleware.InvokeAsync(context);
        
            // Assert
            context.Response.Headers.ContainsKey("X-Correlation-Id").Should().BeTrue();
        }
    }
}
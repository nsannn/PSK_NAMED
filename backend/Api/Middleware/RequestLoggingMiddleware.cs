using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Api.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                                ?? Guid.NewGuid().ToString("N")[..12];

            context.Response.Headers["X-Correlation-Id"] = correlationId;

            var sw = Stopwatch.StartNew();

            using (_logger.BeginScope(new Dictionary<string, object>
            {
                ["CorrelationId"] = correlationId
            }))
            {
                try
                {
                    await _next(context);
                }
                finally
                {
                    sw.Stop();

                    var userName = context.User?.Identity?.IsAuthenticated == true
                        ? context.User.FindFirstValue(ClaimTypes.Email)
                          ?? context.User.Identity.Name
                          ?? "authenticated"
                        : "anonymous";

                    var role = context.User?.FindFirstValue(ClaimTypes.Role) ?? "none";

                    var actionDescriptor = context.GetEndpoint()
                        ?.Metadata
                        ?.GetMetadata<ControllerActionDescriptor>();

                    var className  = actionDescriptor?.ControllerTypeInfo?.FullName ?? "-";
                    var methodName = actionDescriptor?.MethodInfo?.Name ?? "-";

                    var level = context.Response.StatusCode >= 500
                        ? LogLevel.Error
                        : context.Response.StatusCode >= 400
                            ? LogLevel.Warning
                            : LogLevel.Information;

                    _logger.Log(level,
                        "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms | User: {UserName} | Role: {Role} | Action: {ClassName}.{MethodName} | CorrelationId: {CorrelationId}",
                        context.Request.Method,
                        context.Request.Path,
                        context.Response.StatusCode,
                        sw.ElapsedMilliseconds,
                        userName,
                        role,
                        className,
                        methodName,
                        correlationId);
                }
            }
        }
    }
}

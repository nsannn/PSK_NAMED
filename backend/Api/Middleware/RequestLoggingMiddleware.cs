using System.Diagnostics;

namespace Api.Middleware
{
    // Logs every HTTP request with method, path, status code, and duration.
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
            // Generate or reuse correlation ID
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

                    var level = context.Response.StatusCode >= 500
                        ? LogLevel.Error
                        : context.Response.StatusCode >= 400
                            ? LogLevel.Warning
                            : LogLevel.Information;

                    _logger.Log(level,
                        "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms | CorrelationId: {CorrelationId}",
                        context.Request.Method,
                        context.Request.Path,
                        context.Response.StatusCode,
                        sw.ElapsedMilliseconds,
                        correlationId);
                }
            }
        }
    }
}

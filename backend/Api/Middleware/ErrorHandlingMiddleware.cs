using System.Diagnostics;
using System.Net;
using System.Text.Json;

namespace Api.Middleware
{
    // Catches unhandled exceptions and logs them with full context
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

                _logger.LogError(ex,
                    "Unhandled exception on {Method} {Path} | TraceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path,
                    traceId);

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

                var response = new
                {
                    traceId,
                    status = context.Response.StatusCode,
                    message = "An unexpected error occurred.",
                    detail = _env.IsDevelopment() ? ex.ToString() : null
                };

                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                });

                await context.Response.WriteAsync(json);
            }
        }
    }
}

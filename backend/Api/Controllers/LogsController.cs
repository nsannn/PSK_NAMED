using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    // logs the received messages
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly ILogger<LogsController> _logger;

        public LogsController(ILogger<LogsController> logger)
        {
            _logger = logger;
        }

        public class ClientLogEntry
        {
            public string Level { get; set; } = "error";
            public string Message { get; set; } = string.Empty;
            public string? Stack { get; set; }
            public string? Url { get; set; }
            public string? UserAgent { get; set; }
        }

        [HttpPost("client")]
        public IActionResult ReceiveClientLog([FromBody] ClientLogEntry entry)
        {
            var logLevel = entry.Level?.ToLowerInvariant() switch
            {
                "warn" or "warning" => LogLevel.Warning,
                "info" => LogLevel.Information,
                _ => LogLevel.Error,
            };

            _logger.Log(logLevel,
                "[ClientApp] {Message} | URL: {Url} | Stack: {Stack}",
                entry.Message,
                entry.Url ?? "unknown",
                entry.Stack ?? "none");

            return Ok();
        }
    }
}

namespace Api.Services
{
    public class LoggingEmailServiceDecorator : IEmailService
    {
        private readonly IEmailService _inner;
        private readonly ILogger<LoggingEmailServiceDecorator> _logger;

        public LoggingEmailServiceDecorator(IEmailService inner, ILogger<LoggingEmailServiceDecorator> logger)
        {
            _inner = inner;
            _logger = logger;
        }

        public async Task SendTicketConfirmationEmailAsync(
            string toEmail,
            string eventName,
            int quantity,
            string eventDate,
            string eventLocation,
            List<EmailTicketInfo> tickets)
        {
            _logger.LogInformation(
                "Sending ticket confirmation email to {ToEmail} for event '{EventName}' (qty {Quantity})",
                toEmail, eventName, quantity);

            var sw = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                await _inner.SendTicketConfirmationEmailAsync(toEmail, eventName, quantity, eventDate, eventLocation, tickets);
                sw.Stop();
                _logger.LogInformation(
                    "Ticket confirmation email sent to {ToEmail} in {ElapsedMs}ms",
                    toEmail, sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogError(ex,
                    "Failed to send ticket confirmation email to {ToEmail} after {ElapsedMs}ms",
                    toEmail, sw.ElapsedMilliseconds);
                throw;
            }
        }

        public async Task SendEventReminderEmailAsync(string toEmail, string eventName, string eventDate, string eventLocation, bool isManualBlast = false)
        {
            _logger.LogInformation(
                "Sending event reminder email to {ToEmail} for event '{EventName}'",
                toEmail, eventName);

            var sw = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                await _inner.SendEventReminderEmailAsync(toEmail, eventName, eventDate, eventLocation, isManualBlast);
                sw.Stop();
                _logger.LogInformation(
                    "Event reminder email sent to {ToEmail} in {ElapsedMs}ms",
                    toEmail, sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogError(ex,
                    "Failed to send event reminder email to {ToEmail} after {ElapsedMs}ms",
                    toEmail, sw.ElapsedMilliseconds);
                throw;
            }
        }
    }
}

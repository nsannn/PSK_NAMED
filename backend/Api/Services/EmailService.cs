using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace Api.Services
{
    public interface IEmailService
    {
        Task SendTicketConfirmationEmailAsync(string toEmail, string eventName, int quantity, string eventDate, string eventLocation);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendTicketConfirmationEmailAsync(string toEmail, string eventName, int quantity, string eventDate, string eventLocation)
        {
            var host = _config["SMTP_HOST"] ?? "smtp.gmail.com";
            var portString = _config["SMTP_PORT"] ?? "587";
            var port = int.TryParse(portString, out var p) ? p : 587;
            var user = _config["SMTP_USER"];
            var pass = _config["SMTP_PASS"];

            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
            {
                // Can log this later
                Console.WriteLine("SMTP credentials not configured in .env. Skipping email sending.");
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Named Events", user));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = $"Your Tickets for {eventName}";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121111; color: #e0dcdc; padding: 30px; border-radius: 10px; border: 2px solid #393737;'>
                    <h1 style='color: #cd6300; text-align: center;'>Payment Successful!</h1>
                    <p style='font-size: 16px; text-align: center;'>Thank you for your purchase. Here are your ticket details:</p>
                    
                    <div style='background-color: #1a1a1a; border: 1px solid #2b2929; border-radius: 8px; padding: 20px; margin-top: 20px;'>
                        <h2 style='margin-top: 0; color: #ffffff;'>{eventName}</h2>
                        <table style='width: 100%; border-collapse: collapse;'>
                            <tr>
                                <td style='padding: 8px 0; color: #b0acac; border-bottom: 1px solid #2b2929;'>Quantity:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #2b2929;'>{quantity} Ticket(s)</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; color: #b0acac; border-bottom: 1px solid #2b2929;'>Date:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right; border-bottom: 1px solid #2b2929;'>{eventDate}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; color: #b0acac;'>Location:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right;'>{eventLocation}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style='text-align: center; margin-top: 30px; color: #787474; font-size: 14px;'>
                        Please keep this email for your records. If you have any questions, reply to this email.
                    </p>
                </div>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(user, pass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
            }
        }
    }
}

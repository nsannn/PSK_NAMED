using Api.Database;
using Api.Models;
using Api.Database;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;
using QuestPDF;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITicketTokenValidationService _tokenService;
        private readonly ILogger<TicketsController> _logger;

        public TicketsController(ApplicationDbContext db, ITicketTokenValidationService tokenService, ILogger<TicketsController> logger)
        {
            _db = db;
            _tokenService = tokenService;
            _logger = logger;
            // Configure QuestPDF license to Community to avoid license validation exception in dev
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        }

        // GET: api/tickets/download/{token}
        // This endpoint is AllowAnonymous so email links work; token is the authorization.
        [HttpGet("download/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadTicketPdf(string token)
        {
            if (!_tokenService.ValidateToken(token, out var purchasedTicketId))
                return NotFound();

            var ticket = await _db.PurchasedTickets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == purchasedTicketId);

            if (ticket == null)
                return NotFound();

            // Generate QR PNG bytes server-side to avoid external dependencies
            byte[] qrBytes;
            try
            {
                using var qrGenerator = new QRCodeGenerator();
                using var qrData = qrGenerator.CreateQrCode(token, QRCodeGenerator.ECCLevel.Q);
                var png = new PngByteQRCode(qrData);
                qrBytes = png.GetGraphic(20);
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "QR generation failed for token {Token}", token);
                qrBytes = Array.Empty<byte>();
            }

            // Create PDF via QuestPDF
            byte[] pdfBytes;
            try
            {
                var eventName = ticket.EventNameSnapshot ?? "";
                var ticketType = ticket.TicketTypeSnapshot ?? "";
                var when = ticket.EventDateSnapshot.HasValue
                    ? ticket.EventDateSnapshot.Value.ToUniversalTime().ToString("MMMM d, yyyy 'at' h:mm tt 'UTC'")
                    : "";

                var doc = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(40);
                        page.PageColor(Colors.Black);

                        page.Content().Element(content =>
                        {
                            content.AlignCenter().Column(column =>
                            {
                                column.Spacing(15);

                                column.Item().Text(eventName).FontSize(20).FontColor(Colors.White).SemiBold().AlignCenter();

                                column.Item().Element(e =>
                                {
                                    if (qrBytes.Length > 0)
                                    {
                                        e.Container()
                                         .AlignCenter()
                                         .Height(300)
                                         .Width(300)
                                         .Element(img => img.Image(qrBytes, ImageScaling.FitArea));
                                    }
                                    else
                                    {
                                        e.Container()
                                         .Height(300)
                                         .Background(Colors.Grey.Darken3)
                                         .AlignCenter()
                                         .AlignMiddle()
                                         .Text("QR Code")
                                         .FontColor(Colors.White);
                                    }
                                });

                                column.Item().Text($"{ticketType}").FontSize(16).FontColor(Colors.Grey.Lighten2).AlignCenter();
                                column.Item().Text($"When: {when}").FontSize(12).FontColor(Colors.Grey.Lighten2).AlignCenter();
                                column.Item().Text($"Ticket: {ticket.Id}").FontSize(10).FontColor(Colors.Grey.Lighten2).AlignCenter();
                            });
                        });
                    });
                });

                using var ms = new MemoryStream();
                doc.GeneratePdf(ms);
                pdfBytes = ms.ToArray();
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to generate PDF for purchased ticket {TicketId} (token {Token})", ticket.Id, token);
                return StatusCode(500, new { message = "Failed to generate PDF." });
            }

            var filename = $"ticket-{ticket.Id}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }
    }
}

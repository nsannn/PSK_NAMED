namespace Api.Dtos.Event
{
    public class TicketEmailInfo
    {
        public string TicketType { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string QrToken { get; set; } = string.Empty;
    }
}

namespace Api.Dtos.Ticket
{
    public class TicketDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int Sold { get; set; }
        public decimal Price { get; set; }
    }
}
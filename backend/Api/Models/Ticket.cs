namespace Api.Models
{
    public class Ticket
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int Sold { get; set; }
        public decimal Price { get; set; }
        
        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;
    }
}
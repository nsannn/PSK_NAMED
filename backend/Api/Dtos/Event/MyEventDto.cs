namespace Api.Dtos.Event
{
    public class MyEventDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TicketsSold { get; set; }
        public int TicketsTotal { get; set; }
        public string Revenue { get; set; } = string.Empty;
        public decimal RevenueAmount { get; set; }
        public decimal Price { get; set; }
        public bool HasPoster { get; set; }
        public List<MyEventTierDto> Tiers { get; set; } = new();
    }

    public class MyEventTierDto
    {
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int Sold { get; set; }
    }
}
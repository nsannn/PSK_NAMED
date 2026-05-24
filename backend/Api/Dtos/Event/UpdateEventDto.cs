namespace Api.Dtos.Event
{
    public class UpdateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string EventType { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new List<string>();
        public List<CreateTicketTierDto> TicketTiers { get; set; } = new List<CreateTicketTierDto>();
        public uint Version { get; set; }
        public bool ForceOverwrite { get; set; }
    }
}

using Api.Dtos.Tag;
using Api.Dtos.Ticket;

namespace Api.Dtos.Event
{
    public class EventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public List<TicketDto> Tickets { get; set; } = new();
        public List<TagDto> Tags { get; set; } = new();
    }
}
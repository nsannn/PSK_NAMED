namespace Api.Models
{
    public class Event
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public List<Ticket> Tickets { get; set; } = new();

        public List<Tag> Tags { get; set; } = new();
    }
}
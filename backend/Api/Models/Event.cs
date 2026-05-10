namespace Api.Models
{
    public class Event
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    }
}
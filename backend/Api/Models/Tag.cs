namespace Api.Models
{
    public class Tag
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
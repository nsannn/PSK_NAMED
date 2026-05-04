namespace Api.Models
{
    public class Tag
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public List<Event> Events { get; set; } = new();
    }
}
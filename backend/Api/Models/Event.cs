using System.ComponentModel.DataAnnotations;

namespace Api.Models
{

    // TEMP MODEL enough to make checkout

    public class Event
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        [MaxLength(300)]
        public string Location { get; set; } = string.Empty;

        public long PriceInCents { get; set; }

        [MaxLength(3)]
        public string Currency { get; set; } = "eur";

        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        public int AvailableTickets { get; set; }
    }
}

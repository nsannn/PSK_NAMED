using System.ComponentModel.DataAnnotations;

namespace Api.Dtos.Event
{
    public class UpdateEventDto
    {
        [Required(AllowEmptyStrings = false)]
        public string Title { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        public string Description { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        public string Location { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required(AllowEmptyStrings = false)]
        public string EventType { get; set; } = string.Empty;

        [Required]
        [MinLength(1, ErrorMessage = "At least one tag is required.")]
        public List<string> Tags { get; set; } = new List<string>();

        [Required]
        [MinLength(1, ErrorMessage = "At least one ticket tier is required.")]
        public List<UpdateTicketTierDto> TicketTiers { get; set; } = new List<UpdateTicketTierDto>();
        public uint Version { get; set; }
        public bool ForceOverwrite { get; set; }
    }
    public class UpdateTicketTierDto
    {
        public Guid? Id { get; set; }

        [Required(AllowEmptyStrings = false)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be a positive number.")]
        public int Quantity { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be a positive number.")]
        public decimal Price { get; set; }
    }
}

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
        public List<CreateTicketTierDto> TicketTiers { get; set; } = new List<CreateTicketTierDto>();
        public uint Version { get; set; }
        public bool ForceOverwrite { get; set; }
    }
}

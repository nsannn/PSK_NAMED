namespace Api.Dtos.Validation{
    public class TicketValidationDto{
        public string Status {get;set;}=string.Empty;
        public string Title {get;set;}=string.Empty;
        public string Message {get;set;}=string.Empty;

        public Guid? PurchasedTicketId {get;set;}

        public string? EventName {get;set;}
        public string? TicketType {get;set;}
        public decimal? Price {get;set;}

        public DateTime? EventDate {get;set;}
        public DateTime? UsedAt {get;set;}
    }
}

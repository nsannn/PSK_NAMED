namespace Api.Dtos.Ticket{
    public class MyTicketDto{
        public Guid PurchasedTicketId {get;set;}

        public string TicketType {get;set;}=string.Empty;
        public decimal Price {get;set;}

        public string Status {get;set;}=string.Empty;

        public DateTime CreatedAt {get;set;}
        public DateTime? UsedAt {get;set;}
    }
}

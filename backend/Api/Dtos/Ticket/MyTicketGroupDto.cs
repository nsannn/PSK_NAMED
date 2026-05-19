namespace Api.Dtos.Ticket{
    public class MyTicketGroupDto{
        public Guid EventId {get;set;}
        public string EventName {get;set;}=string.Empty;
        public DateTime? EventDate {get;set;}

        public List<MyTicketDto> Tickets {get;set;}=new();
    }
}

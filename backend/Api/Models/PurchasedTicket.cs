namespace Api.Models{
	public enum PurchasedTicketStatus{
		Active,
		Used
	}
	
	public class PurchasedTicket{
		public Guid Id {get;set;}

		public Guid UserId {get;set;}
		public User User {get;set;}=null!;

		public Guid EventId {get;set;}
		public Event Event {get;set;}=null!;

		public Guid TicketId {get;set;}
		public Ticket Ticket {get;set;}=null!;

		public string TicketTypeSnapshot {get;set;}=string.Empty;
		public decimal PriceSnapshot {get;set;}

		public PurchasedTicketStatus Status {get;set;}=PurchasedTicketStatus.Active;

		public DateTime CreatedAt {get;set;}=DateTime.UtcNow;
		public DateTime? UsedAt {get;set;}

		public Guid? UsedByStaffId {get;set;}
		public User? UsedByStaff {get;set;}
	}
}
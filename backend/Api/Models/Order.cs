using System;

namespace Api.Models
{
    public enum OrderStatus { Paid, Refunded }

    public class Order
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string CustomerEmail { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal AmountPaid { get; set; }
        public string StripePaymentIntentId { get; set; } = string.Empty;
        public string StripeSessionId { get; set; } = string.Empty;
        public OrderStatus Status { get; set; } = OrderStatus.Paid;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RefundedAt { get; set; }
        public ICollection<PurchasedTicket> PurchasedTickets {get;set;}=new List<PurchasedTicket>();
    }
}
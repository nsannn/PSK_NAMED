using System;

namespace Api.Models
{
    public enum OrderStatus { Paid, Refunded }

    public class Order
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Event Event { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public string CustomerEmail { get; set; }
        public int Quantity { get; set; }
        public decimal AmountPaid { get; set; }
        public string StripePaymentIntentId { get; set; }
        public string StripeSessionId { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Paid;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RefundedAt { get; set; }
    }
}
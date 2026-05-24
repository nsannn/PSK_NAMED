using Api.Models;

namespace Api.Services
{
    /// <summary>
    /// Default allocation strategy: picks the cheapest ticket tier that can
    /// satisfy the full requested quantity in one shot.
    /// To switch to a different algorithm (e.g. split across tiers, VIP-first),
    /// implement ITicketAllocationStrategy and change the registration in Program.cs.
    /// </summary>
    public class CheapestFirstTicketAllocationStrategy : ITicketAllocationStrategy
    {
        public Order? Allocate(
            Event ev,
            Guid userId,
            string customerEmail,
            int quantity,
            decimal amountPaid,
            string stripeSessionId,
            string stripePaymentIntentId)
        {
            var tier = ev.Tickets
                .OrderBy(t => t.Price)
                .FirstOrDefault(t => t.Quantity - t.Sold >= quantity);

            if (tier is null)
                return null;

            tier.Sold += quantity;

            return new Order
            {
                EventId              = ev.Id,
                UserId               = userId,
                CustomerEmail        = customerEmail,
                Quantity             = quantity,
                AmountPaid           = amountPaid,
                StripeSessionId      = stripeSessionId,
                StripePaymentIntentId = stripePaymentIntentId,
                Status               = OrderStatus.Paid,
                CreatedAt            = DateTime.UtcNow
            };
        }
    }
}

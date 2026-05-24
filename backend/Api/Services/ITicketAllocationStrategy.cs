using Api.Models;

namespace Api.Services
{
    /// <summary>
    /// Defines how tickets are selected and deducted from an event when a purchase is confirmed.
    /// Swap the registered implementation in Program.cs to change allocation behaviour
    /// without modifying any controller or other business code.
    /// </summary>
    public interface ITicketAllocationStrategy
    {
        /// <summary>
        /// Attempts to allocate <paramref name="quantity"/> tickets from <paramref name="ev"/>.
        /// Mutates ticket Sold counts on success and returns a ready-to-persist Order.
        /// Returns null when no tier has sufficient availability.
        /// </summary>
        Order? Allocate(
            Event ev,
            Guid userId,
            string customerEmail,
            int quantity,
            decimal amountPaid,
            string stripeSessionId,
            string stripePaymentIntentId);
    }
}

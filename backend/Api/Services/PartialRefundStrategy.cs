namespace Api.Services
{
    public class PartialRefundStrategy : IRefundStrategy
    {
        private const double RefundPercentage = 0.90;

        public string PolicyName => "90% Refund (10% service fee)";

        public long CalculateRefundAmount(long amountPaidCents)
        {
            return (long)(amountPaidCents * RefundPercentage);
        }
    }
}

namespace Api.Services
{
    public class FullRefundStrategy : IRefundStrategy
    {
        public string PolicyName => "Full Refund";

        public long CalculateRefundAmount(long amountPaidCents)
        {
            return amountPaidCents;
        }
    }
}

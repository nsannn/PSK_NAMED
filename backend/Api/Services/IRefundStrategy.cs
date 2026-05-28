namespace Api.Services
{
    public interface IRefundStrategy
    {
        long CalculateRefundAmount(long amountPaidCents);
        string PolicyName { get; }
    }
}

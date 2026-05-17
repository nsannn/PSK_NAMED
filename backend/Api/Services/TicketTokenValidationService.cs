using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;

namespace Api.Services{
    public interface ITicketTokenValidationService{
        string CreateToken(Guid purchasedTicketId);
        bool ValidateToken(string token,out Guid purchasedTicketId);
    }
    
    public class TicketTokenValidationService:ITicketTokenValidationService{
        private readonly string _secretKey;

        public TicketTokenValidationService(IConfiguration configuration){
            _secretKey=configuration["TICKET_TOKEN_SECRET"]
                ?? throw new InvalidOperationException("TICKET_TOKEN_SECRET is not configured.");

            if(_secretKey.Length<32)
                throw new InvalidOperationException("TICKET_TOKEN_SECRET must be at least 32 characters long.");
        }

        public string CreateToken(Guid purchasedTicketId){
            var payload=purchasedTicketId.ToString();
            var signature=CreateSignature(payload);

            return $"{payload}.{signature}";
        }

        public bool ValidateToken(string token,out Guid purchasedTicketId){
            purchasedTicketId=Guid.Empty;

            if(string.IsNullOrWhiteSpace(token))
                return false;

            var parts=token.Split('.');
            if(parts.Length!=2)
                return false;

            var payload=parts[0];
            var providedSignature=parts[1];

            if(!Guid.TryParse(payload,out purchasedTicketId))
                return false;

            var expectedSignature=CreateSignature(payload);

            var providedBytes=Encoding.UTF8.GetBytes(providedSignature);
            var expectedBytes=Encoding.UTF8.GetBytes(expectedSignature);

            if(providedBytes.Length!=expectedBytes.Length)
                return false;

            return CryptographicOperations.FixedTimeEquals(providedBytes,expectedBytes);
        }

        private string CreateSignature(string payload){
            using var hmac=new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
            var signatureBytes=hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

            return WebEncoders.Base64UrlEncode(signatureBytes);
        }
    }
}

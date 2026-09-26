
namespace Identity.Services.EmailTokenService;

public interface IEmailTokenService
{
    Task<string> GenerateToken(Guid userId, string email, CancellationToken ct = default);
    Task<TokenPayload?> ValidateToken(string token, CancellationToken ct = default);
}
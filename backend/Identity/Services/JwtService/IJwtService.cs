using Identity.Data.Models;
using Identity.Dto;

namespace Identity.Services.JwtService;

public interface IJwtService
{
    Task<JwtResponse> GenerateJwt(User user);
    Task RevokeRefreshs(Guid userId, CancellationToken ct = default);
    Task<string> GenerateRefresh(Guid userId, CancellationToken ct = default);
    Task<JwtResponse?> ValidateRefreshJwt(string token, CancellationToken ct = default);
}
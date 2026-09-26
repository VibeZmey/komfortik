using Identity.Data.Context;
using Identity.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Identity.Services.EmailTokenService;

using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;

public class EmailTokenService : IEmailTokenService
{
    private readonly IDataProtector _protector;
    private readonly IIdentityDbContext _context;
    private readonly TimeSpan _tokenLifetime = TimeSpan.FromMinutes(15);

    public EmailTokenService(
        IDataProtectionProvider provider,
        IIdentityDbContext context)
    {
        _context = context;
        _protector = provider.CreateProtector("EmailConfirmation.v1");
    }

    public async Task<string> GenerateToken(Guid userId, string email, CancellationToken ct = default)
    {
        
        await _context.EmailVerificationTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(t => t.IsRevoked, true), ct);
        
        var recentTokensCount = await _context.EmailVerificationTokens
            .CountAsync(t => t.UserId == userId && 
                             t.CreatedAt > DateTime.UtcNow.AddHours(-1), ct);
        
        if (recentTokensCount >= 5)
            throw new Exception("Too many requests, try later");
        
        var token = new EmailVerificationToken()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Email = email,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(_tokenLifetime),
            IsRevoked = false
        };

        var payload = new TokenPayload()
        {
            Id = token.Id,
            UserId = token.UserId,
            CreatedAt = token.CreatedAt,
            ExpiresAt = token.ExpiresAt,
        };
        
        token.Token = _protector.Protect(JsonSerializer.Serialize(payload));
        
        await _context.EmailVerificationTokens.AddAsync(token, ct);
        await _context.SaveChangesAsync(ct);
        return token.Token;
    }

    public async Task<TokenPayload?> ValidateToken(string token, CancellationToken ct = default)
    {
        try
        {
            var json = _protector.Unprotect(token);
            var payload = JsonSerializer.Deserialize<TokenPayload>(json);
            
            var tokenEntity = await _context.EmailVerificationTokens
                .FirstOrDefaultAsync(t => t.Id == payload.Id && t.UserId == payload.UserId, ct);

            if (tokenEntity is null || tokenEntity.IsRevoked || tokenEntity.ExpiresAt < DateTime.UtcNow)
                return null;
            
            return payload;
        }
        catch
        {
            return null;
        }
    }
}

public record TokenPayload
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
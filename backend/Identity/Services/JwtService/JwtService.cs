using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Identity.Data.Context;
using Identity.Data.Models;
using Identity.Dto;
using Identity.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Identity.Services.JwtService;

internal class JwtService : IJwtService
{
    private readonly RSA _rsaPrivateKey;
    private readonly JwtOptions _options;
    private readonly IIdentityDbContext _context;
    private readonly ILogger<JwtService> _logger;
    
    public JwtService(IOptions<JwtOptions>  options, 
        IIdentityDbContext context, 
        ILogger<JwtService> logger,
        IWebHostEnvironment env)
    {
        _options = options.Value;
        _context = context;
        _logger = logger;
        var keyPath = Path.Combine(env.ContentRootPath, _options.PrivateKeyPath);
        var privateKeyBytes = File.ReadAllText(keyPath);
        _rsaPrivateKey = RSA.Create();
        _rsaPrivateKey.ImportFromPem(privateKeyBytes);
    }
    
    public async Task<JwtResponse> GenerateJwt(User user)
    {
        var role = await _context
            .Roles
            .AsNoTracking()
            .FirstAsync(r => 
                r.Id == user.RoleId);
        
        Claim[] claims = [
            new ("userId", user.Id.ToString()),
            new ("role", role.Name),
            new ("email", user.Email)
        ];

        var tokenExpires = DateTime.UtcNow.AddMinutes(_options.TokenValidityMins);
        var signingCredentials = new SigningCredentials(
            new RsaSecurityKey(_rsaPrivateKey),
            SecurityAlgorithms.RsaSha256);
        
        var jwtToken = new JwtSecurityToken(
            claims: claims,
            signingCredentials: signingCredentials,
            expires: tokenExpires);
        
        var accessToken = new JwtSecurityTokenHandler().WriteToken(jwtToken);
        
        var res = new JwtResponse()
        {
            UserId = user.Id,
            AccessToken = accessToken,
            ExpiresIn = (int)tokenExpires.Subtract(DateTime.UtcNow).TotalSeconds,
            RefreshToken = await GenerateRefresh(user.Id)
        };
        
        return res;
    }

    public async Task<JwtResponse?> ValidateRefreshJwt(string token, CancellationToken ct = default)
    {
        var refreshToken = await _context
            .RefreshTokens
            .FirstOrDefaultAsync(r => 
                r.Token == token, ct);
        
        if (refreshToken is null ||
            refreshToken.ExpiresAt < DateTime.UtcNow) 
            return null;

        if (refreshToken.RevokedAt is not null)
        {
            _logger.LogWarning("Попытка использования отозванного токена: {Token}", token);
            return null;
        }
        
        refreshToken.RevokedAt = DateTime.UtcNow;
        
        var user = await _context
            .Users
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == refreshToken.UserId, ct);
        
        if(user is null)
            return null;
        
        await _context.SaveChangesAsync(ct);
        return await GenerateJwt(user);
    }

    public async Task<string> GenerateRefresh(Guid userId, CancellationToken ct = default)
    {
        RefreshToken refreshToken = new RefreshToken()
        {
            Token = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)),
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_options.RefreshTokenValidityMins)
        };
        
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync(ct);
        return refreshToken.Token;
    }

    public async Task RevokeRefreshs(Guid userId, CancellationToken ct = default)
    {
        var tokens = await _context
            .RefreshTokens
            .Where(r => r.UserId == userId && r.RevokedAt != null)
            .ToListAsync(ct);

        foreach (var t in tokens)
        {
            t.RevokedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync(ct);
    }
    
    public void Dispose()
    {
        _rsaPrivateKey.Dispose();
    }
}
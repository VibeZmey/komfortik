using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Flights;

public static class Extension
{
    public static void AddApiAuthentication(
        this IServiceCollection services, 
        IConfiguration configuration,
        IWebHostEnvironment env)
    {
        var jwtOptions = configuration.GetSection(nameof(JwtOptions)).Get<JwtOptions>();
        var keyPath = Path.Combine(env.ContentRootPath, jwtOptions.PublicKeyPath);
        var publicKeyBytes = File.ReadAllText(keyPath);
        var rsaPublicKey = RSA.Create();
        rsaPublicKey.ImportFromPem(publicKeyBytes);
        services.AddSingleton(rsaPublicKey);
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ClockSkew = TimeSpan.Zero,
                    IssuerSigningKey = new RsaSecurityKey(rsaPublicKey),
                };
                
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["cute-cookies"];
                        return Task.CompletedTask;
                    }
                };
            });
        
        services.AddAuthorization();
    }
}

public class JwtOptions
{
    public int TokenValidityMins { get; set; }
    public int RefreshTokenValidityMins { get; set; }
    public string PrivateKeyPath { get; set; }
    public string PublicKeyPath { get; set; }
}
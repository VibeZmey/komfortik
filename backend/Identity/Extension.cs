using System.Security.Cryptography;
using System.Text;
using Identity.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Identity;

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
            });
        
        services.AddAuthorization();
    }
}
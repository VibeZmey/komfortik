namespace Identity.Options;

public class JwtOptions
{
    public int TokenValidityMins { get; set; }
    public int RefreshTokenValidityMins { get; set; }
    public string PrivateKeyPath { get; set; }
    public string PublicKeyPath { get; set; }
}
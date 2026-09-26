namespace Identity.Dto;

public class JwtResponse
{
    public Guid UserId { get; set; }
    public string? AccessToken { get; set; }
    public int ExpiresIn { get; set; }
    public string? RefreshToken { get; set; }
}
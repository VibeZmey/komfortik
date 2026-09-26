using System.Text.Json.Serialization;

namespace Identity.Data.Models;

public class RefreshToken
{
    public string Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid UserId { get; set; }
    [JsonIgnore]
    public User User { get; set; }
}
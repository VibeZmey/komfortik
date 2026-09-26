using System.Text.Json.Serialization;

namespace Identity.Data.Models;

public class User
{
    public Guid Id { get; set; }
    [JsonIgnore]
    public string PasswordHash { get; set; }
    public string Email { get; set; }
    public bool EmailConfirmed { get; set; } = false;
    public string? Country { get; set; }
    public string? Citizenship { get; set; }
    public string? Currency { get; set; }
    public bool IsBlocked { get; set; } = false;
    public Guid RoleId { get; set; }
    [JsonIgnore]
    public Role Role { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    [JsonIgnore]
    public List<RefreshToken> RefreshTokens { get; set; }
    [JsonIgnore]
    public List<EmailVerificationToken> EmailVerificationTokens { get; set; }
}
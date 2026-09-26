namespace Identity.Dto;

public class GetUserResponse
{
    public Guid Id { get; set; }
    public string? Email { get; set; }
    public string? Country { get; set; }
    public string? Citizenship { get; set; }
    public string? Currency { get; set; }
    public bool IsBlocked { get; set; } = false;
    public Guid RoleId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
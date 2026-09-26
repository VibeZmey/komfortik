namespace Identity.Dto;

public class UserDto
{
    public Guid Id { get; set; }
    public string? Email { get; set; }
    public string? Country { get; set; }
    public bool IsBlocked { get; set; } = false;
    public string Role { get; set; }
    public DateTime CreatedAt { get; set; }
}
namespace SharedContracts.Messages;

public record UserRegistered
{
    public string Email { get; set; }
    public string ConfirmationLink { get; set; }
    public DateTime CreatedAt { get; set; }
};
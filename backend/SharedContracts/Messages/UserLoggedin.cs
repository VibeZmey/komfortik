namespace SharedContracts.Messages;

public class UserLoggedin
{
    public string Email { get; set; }
    public string ConfirmationLink { get; set; }
    public DateTime CreatedAt { get; set; }
}
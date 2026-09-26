namespace SharedContracts.Messages;

public class BoardingPassCreated
{
    public Guid OrderId { get; set; }
    public decimal TotalPrice { get; set; }
    public string Email { get; set; }
}

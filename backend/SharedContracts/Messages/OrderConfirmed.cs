namespace SharedContracts.Messages;

public class OrderConfirmed
{
    public Guid OrderId { get; set; }
    public decimal TotalPrice { get; set; }
    public string Email { get; set; }
    public List<BoardingPass> BoardingPasses { get; set; } = new();
}
public class BoardingPass
{
    public Guid Id { get; set; }
    
    public string PassengerFirstName { get; set; } = string.Empty;
    public string? PassengerMiddleName { get; set; }
    public string PassengerLastName { get; set; } = string.Empty;
    
    public string SeatNumber { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool HasLuggage { get; set; }
    public bool HasFood { get; set; }
    public bool IsBusiness { get; set; }
    public string Status { get; set; } = string.Empty;
    
    public string FlightNumber { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public int DepartureOffset { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int ArrivalOffset { get; set; }
    public string DepartureCity { get; set; } = string.Empty;
    public string ArrivalCity { get; set; } = string.Empty;
    public string AirplaneModel { get; set; } = string.Empty;
    
    public DateTime BookingCreatedAt { get; set; }
}
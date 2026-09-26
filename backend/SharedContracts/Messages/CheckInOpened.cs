namespace SharedContracts.Messages;

public class CheckInOpened
{
    public string FlightNumber { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime DepartureTime { get; set; }
}
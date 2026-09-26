using Flights.Domain.Models;

namespace Flights.Domain.Dto;

public class FlightDto
{
    public Guid Id { get; set; }
    public int DurationMins { get; set; }
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int TotalSeats { get; set; }
    public int BookedSeats { get; set; } = 0;
    public int BusinessSeats { get; set; }
    public int BookedBusinessSeats { get; set; } = 0;
    public decimal FlightPrice { get; set; }
    public decimal LuggagePrice { get; set; }
    public decimal BusinessPrice { get; set; }
    public decimal FoodPrice { get; set; }
    public FlightStatus Status { get; set; }
    public AirportDto FromAirport { get; set; }
    public AirportDto ToAirport { get; set; }
    public AirplaneDto Airplane { get; set; }
    public ICollection<string> Bookings { get; set; }
}
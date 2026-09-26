using Flights.Domain.Models;

namespace Flights.Domain.Dto;

public record BookingDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string LastName { get; set; }
    
    public string SeatNumber { get; set; }

    public FlightForBookingDto Flight { get; init; }
    
    public bool HasLuggage { get; set; }
    public bool HasFood { get; set; } 
    public bool IsBusiness { get; set; } 
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record FlightForBookingDto
{
    public Guid Id { get; init; }
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int DurationMins { get; set; }
    public string AirlineName { get; set; }
    public AirportDto FromAirport { get; set; }
    public AirportDto ToAirport { get; set; }
}
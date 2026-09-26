namespace Flights.Domain.Models;

public class Airport
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string City { get; set; }
    public string CountryName { get; set; }
    public string? CountryCode { get; set; }
    public int TimezoneOffset { get; set; }
    
    public ICollection<Flight> DepartingFlights { get; set; }
    
    public ICollection<Flight> ArrivingFlights { get; set; }
}
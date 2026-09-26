namespace Flights.Domain.Dto;

public class AirportDto
{ 
    public string CountryName { get; set; }
    public string City { get; set; }
    public string Code { get; set; }
    public int TimezoneOffset { get; set; }
}
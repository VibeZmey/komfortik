namespace Flights.Domain.Models;

public class Airline
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? IconUrl { get; set; }
    public double Coefficient { get; set; }
    public ICollection<Airplane> Airplanes { get; set; }
}
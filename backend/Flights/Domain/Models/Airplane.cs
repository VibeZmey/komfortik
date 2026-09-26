using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Flights.Domain.Models;

public class Airplane
{
    public int Id { get; set; }
    
    [MaxLength(100)] 
    public string Name { get; set; } 
    public int Rows { get; set; }
    public int Columns { get; set; }
    
    public int BuisnessRows { get; set; }
    public int BuisnessColumns { get; set; }
    public int TotalSeats { get; set; }
    public int SpacePlusRow { get; set; }
    
    public int AirlineId { get; set; }
    public Airline Airline { get; set; }
    
    public ICollection<Flight> Flights { get; set; }
}

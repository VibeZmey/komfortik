namespace Flights.Domain.Dto;

public class AirplaneDto
{
    public string Name { get; set; } 
    public int Rows { get; set; }
    public int Columns { get; set; }
    
    public int BuisnessRows { get; set; }
    public int BuisnessColumns { get; set; }
    public int SpacePlusRow { get; set; }
    
    public int AirlineId { get; set; }
}
using Flights.Application.Features.Passengers.CreatePassenger;
using Flights.Domain.Models;

namespace Flights.Application.Features.Passengers.UpdatePassengerInfo;

public class UpdatePassengerDto
{
    public Guid Id { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public static UpdatePassengerDto Map(Passenger passenger)
    {
        return new UpdatePassengerDto
        {
            Id = passenger.Id,
        };
    }
}
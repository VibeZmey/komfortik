using Flights.Domain.Models;

namespace Flights.Application.Features.Passengers.CreatePassenger;

public class CreatePassengerDto
{
    public Guid Id { get; set; }
    public PassengerType Type { get; set; }
    public Guid UserId { get; set; }

    public static CreatePassengerDto Map(Passenger passenger)
    {
        return new CreatePassengerDto
        {
            Id = passenger.Id,
            Type = passenger.Type,
            UserId = passenger.UserId
        };
    }
}
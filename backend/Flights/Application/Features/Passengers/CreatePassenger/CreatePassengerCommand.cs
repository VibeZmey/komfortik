using MediatR;
using Flights.Domain.Models;

namespace Flights.Application.Features.Passengers.CreatePassenger;

public record CreatePassengerCommand : IRequest<CreatePassengerDto>
{
    public PassengerType Type { get; set; }
    public bool IsSaved { get; set; }
    public Guid UserId { get; set; }
}
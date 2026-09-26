using MediatR;

namespace Flights.Application.Features.Passengers.DeletePassenger;

public class DeletePassengerCommand : IRequest<Unit>
{
    public Guid PassengerId { get; set; }
}
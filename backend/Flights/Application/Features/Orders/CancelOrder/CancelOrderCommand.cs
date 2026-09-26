using MediatR;

namespace Flights.Application.Features.Orders.CancelOrder;

public class CancelOrderCommand : IRequest<Unit>
{
    public Guid OrderId { get; set; }
}
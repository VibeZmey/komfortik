using MediatR;

namespace Flights.Application.Features.Orders.ConfirmOrder;

public class ConfirmOrderCommand : IRequest<Unit>
{
    public Guid OrderId { get; set; }
    public string Email { get; set; }
}
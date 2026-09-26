using Flights.Domain.Dto;
using MediatR;

namespace Flights.Application.Features.Orders.GetOrderById;

public class GetOrderByIdQuery : IRequest<OrderDto>
{
    public Guid OrderId { get; set; }
}
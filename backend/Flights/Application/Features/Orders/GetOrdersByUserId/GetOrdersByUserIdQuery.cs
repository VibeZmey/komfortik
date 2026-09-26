using Flights.Domain.Dto;
using MediatR;

namespace Flights.Application.Features.Orders.GetOrdersByUserId;

public class GetOrdersByUserIdQuery : IRequest<List<OrderDto>>
{
    public Guid UserId { get; set; }
}
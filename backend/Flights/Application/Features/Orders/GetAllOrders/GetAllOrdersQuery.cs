using Flights.Domain.Dto;
using MediatR;

namespace Flights.Application.Features.Orders.GetAllOrders;

public class GetAllOrdersQuery : IRequest<List<OrderDto>>
{
    
}
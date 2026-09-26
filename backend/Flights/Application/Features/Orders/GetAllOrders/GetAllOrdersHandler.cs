using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Orders.GetAllOrders;

public class GetAllOrdersHandler : IRequestHandler<GetAllOrdersQuery, List<OrderDto>>
{
    private readonly IOrderRepository _orderRepo;
    
    public GetAllOrdersHandler(IOrderRepository orderRepository)
    {
        _orderRepo = orderRepository;
    }
    
    public Task<List<OrderDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        return _orderRepo.GetAllOrdersAsync(cancellationToken);
    }
}
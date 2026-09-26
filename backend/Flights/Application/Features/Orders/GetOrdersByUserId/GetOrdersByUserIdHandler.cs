using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Orders.GetOrdersByUserId;

public class GetOrdersByUserIdHandler : IRequestHandler<GetOrdersByUserIdQuery ,List<OrderDto>>
{
    private readonly IOrderRepository _orderRepo;

    public GetOrdersByUserIdHandler(IOrderRepository orderRepository)
    {
        _orderRepo = orderRepository;
    }
    
    public async Task<List<OrderDto>> Handle(GetOrdersByUserIdQuery request, CancellationToken cancellationToken)
    {
        var orders = await _orderRepo
            .GetOrdersByUserIdAsync(request.UserId, cancellationToken);
        
        return orders;
    }
}
using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using MediatR;
using Order = Flights.Domain.Models.Order;

namespace Flights.Application.Features.Orders.GetOrderById;

public class GetOrderByIdHandler : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    private readonly IOrderRepository _orderRepo;

    public GetOrderByIdHandler(IOrderRepository orderRepo)
    {
        _orderRepo = orderRepo;
    }
    
    public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _orderRepo.GetByIdAsync(request.OrderId, cancellationToken);
        
        if(order is null)
            throw new ApplicationException($"Order with id {request.OrderId} not found");
        
        return Order.ToDto(order);
    }
}
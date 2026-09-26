using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Orders.CancelOrder;

public class CancelOrderHandler : IRequestHandler<CancelOrderCommand, Unit>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IUnitOfWork _unitOfWork;

    public CancelOrderHandler(
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork)
    {
        _orderRepo = orderRepository;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Unit> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _orderRepo.GetByIdAsync(request.OrderId, cancellationToken);
        if(order is null)
            throw new ApplicationException("Order not found");
        order.Cancel();
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
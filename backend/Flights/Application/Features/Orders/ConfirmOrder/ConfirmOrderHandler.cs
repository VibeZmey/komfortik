using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;
using SharedContracts.Messages;
using IPublisher = Flights.Application.Common.Interfaces.IPublisher;

namespace Flights.Application.Features.Orders.ConfirmOrder;

public class ConfirmOrderHandler : IRequestHandler<ConfirmOrderCommand, Unit>
{
    private readonly INotificationRepository _notifyRepo;
    private readonly IPublisher _publisher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderRepository _orderRepo;
    private readonly ILogger<ConfirmOrderHandler> _logger;

    public ConfirmOrderHandler(
        IUnitOfWork unitOfWork, 
        IOrderRepository orderRepo,
        IPublisher publisher,
        ILogger<ConfirmOrderHandler> logger,
        INotificationRepository notifyRepo)
    {
        _orderRepo = orderRepo;
        _unitOfWork = unitOfWork;
        _notifyRepo = notifyRepo;
        _logger = logger;
        _publisher = publisher;
    }
    
    public async Task<Unit> Handle(ConfirmOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _orderRepo.GetByIdAsync(request.OrderId, cancellationToken);
        if(order is null)
            throw new ApplicationException("Order not found");
        
        order.Confirm();
        //TODO: websocket
        var notify = Notification.CreateOrderConfirmed(order);
        _logger.LogInformation($"Send message in topic 'order-confirmed' about order {order.Id}");
        await _publisher.PublishAsync("order-confirmed",order.Id.ToString(), new OrderConfirmed
        {
            OrderId = order.Id,
            TotalPrice = order.TotalPrice,
            Email = request.Email,
            BoardingPasses = await _orderRepo
                .GetOrderForBoardingPassesAsync(order.Id, cancellationToken)
        }, cancellationToken);
        
        _logger.LogInformation($"Order {order.Id} has been confirmed");
        await _notifyRepo.AddAsync(notify, cancellationToken);
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
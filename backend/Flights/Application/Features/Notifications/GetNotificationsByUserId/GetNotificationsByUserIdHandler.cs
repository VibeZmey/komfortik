using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Notifications.GetNotificationsByUserId;

public class GetNotificationsByUserIdHandler : IRequestHandler<GetNotificationsByUserIdQuery, List<NotificationDto>>
{
    private readonly INotificationRepository _notifyRepo;

    public GetNotificationsByUserIdHandler(
        INotificationRepository notification)
    {
        _notifyRepo = notification;
    }
    
    public Task<List<NotificationDto>> Handle(GetNotificationsByUserIdQuery request, CancellationToken cancellationToken)
    {
        return _notifyRepo.GetByUserId(request.UserId);
    }
}
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Notifications.MarkAsReadByNotificationId;

public class MarkAsReadByNotificationIdHandler : IRequestHandler<MarkAsReadByNotificationIdQuery, Unit>
{
    private readonly INotificationRepository _notificationRepo;
    private readonly IUnitOfWork _unitOfWork;

    public MarkAsReadByNotificationIdHandler(
        INotificationRepository notificationRepo,
        IUnitOfWork unitOfWork)
    {
        _notificationRepo = notificationRepo;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Unit> Handle(MarkAsReadByNotificationIdQuery request, CancellationToken cancellationToken)
    {
        var notify = await _notificationRepo
            .GetByIdAsync(request.NotificationId, cancellationToken);
        if (notify is null)
            throw new ApplicationException("Notification not found");
        
        notify.MarkAsRead();
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
using MediatR;

namespace Flights.Application.Features.Notifications.MarkAsReadByNotificationId;

public class MarkAsReadByNotificationIdQuery : IRequest<Unit>
{
    public Guid NotificationId { get; set; }
}
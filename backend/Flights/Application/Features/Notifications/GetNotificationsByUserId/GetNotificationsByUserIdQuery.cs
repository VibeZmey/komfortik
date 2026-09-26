using Flights.Domain.Dto;
using MediatR;

namespace Flights.Application.Features.Notifications.GetNotificationsByUserId;

public class GetNotificationsByUserIdQuery : IRequest<List<NotificationDto>>
{
    public Guid UserId { get; set; }
}
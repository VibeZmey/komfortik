using Flights.Domain.Dto;
using Flights.Domain.Models;

namespace Flights.Domain.Interfaces;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(Guid notificationId, 
        CancellationToken ct = default);
    Task<List<NotificationDto>> GetByUserId(Guid userId);
    Task AddRangeAsync(IReadOnlyCollection<Notification> notifications, 
        CancellationToken ct = default);
    Task AddAsync(Notification notification, 
        CancellationToken ct = default);
}
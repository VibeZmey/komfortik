using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly FlightsDbContext _context;

    public NotificationRepository(FlightsDbContext context)
    {
        _context = context;
    }

    public async Task<Notification?> GetByIdAsync(Guid notificationId, CancellationToken ct = default)
    {
        return await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId, ct);
    }

    public async Task AddAsync(Notification notification, CancellationToken ct = default)
    {
        await _context.Notifications
            .AddAsync(notification, ct);
    } 
    
    public async Task<List<NotificationDto>> GetByUserId(Guid userId)
    {
        return _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .Select(Notification.ToDto)
            .ToList();
    }

    public async Task AddRangeAsync(IReadOnlyCollection<Notification> notifications, CancellationToken ct = default)
    {
        await _context.Notifications
            .AddRangeAsync(notifications, ct);
    }
}
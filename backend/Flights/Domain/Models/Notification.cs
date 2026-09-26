using Flights.Domain.Dto;

namespace Flights.Domain.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public NotificationPayload Payload { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public void MarkAsRead() => IsRead = true;

    public static NotificationDto ToDto(Notification notification)
    {
        return new NotificationDto()
        {
            Id = notification.Id,
            Type = notification.Type,
            Payload = notification.Payload,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }

    public static Notification CreateCheckInOpened(Flight flight, Guid userId)
    {
        return new Notification()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = NotificationType.CheckInOpened,
            Payload = new NotificationPayload()
            {
                FlightNumber = flight.Number,
                DepartureTime = flight.DepartureTime,
                StartTime = flight.DepartureTime.AddHours(-24),
                EndTime = flight.DepartureTime.AddMinutes(-30),
                Status = flight.Status,
            }
        };
    }
    public static Notification CreateOrderConfirmed(Order order)
    {
        return new Notification()
        {
            Id = Guid.NewGuid(),
            UserId = order.UserId,
            Type = NotificationType.OrderConfirmed,
            Payload = new NotificationPayload()
            {
                OrderId = order.Id,
                TotalPrice = order.TotalPrice
            }
        };
    }
}

public record NotificationPayload
{
    public string? FlightNumber { get; set; }
    public DateTime? DepartureTime { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public string? Gate { get; set; }
    public string? CityFrom { get; set; }
    public string? CityTo { get; set; }
    public FlightStatus Status { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public Guid? OrderId { get; set; }
    public string? BookingReference { get; set; }
    public string? PassengerName { get; set; }
    public string? PassengerEmail { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Currency { get; set; }
    public TimeSpan? HoursBefore { get; set; }
    public string? Title { get; set; }
    public string? Message { get; set; }
}

public enum NotificationType
{
    OrderConfirmed,
    OrderCancelled,
    OrderCreated,
    OrderExpired,
    CheckInOpened,         
}
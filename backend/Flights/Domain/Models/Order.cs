using Flights.Domain.Dto;
using Flights.Domain.Interfaces;

namespace Flights.Domain.Models;

public class Order
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ICollection<Booking> Bookings { get; set; } = [];
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalPrice { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public static OrderDto ToDto(Order order)
    {
        return new OrderDto
        {
            Bookings = order.Bookings.Select(Booking.ToDto).ToList(),
            TotalPrice = order.TotalPrice,
            OrderId = order.Id,
            CreatedAt = order.CreatedAt,
            Status = order.Status
        };
    }

    public static Order Create(Guid userId)
    {
        return new Order()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
        };
    }
    
    public void AddBooking(Booking booking)
    { 
        Bookings.Add(booking);
        TotalPrice += booking.TotalPrice;
    }
    
    public void Confirm() => Status = OrderStatus.Confirmed;
    public void Cancel() => Status = OrderStatus.Cancelled;
}

public enum OrderStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Expired
}
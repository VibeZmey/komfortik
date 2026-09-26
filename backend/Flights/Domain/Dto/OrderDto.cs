using Flights.Domain.Models;

namespace Flights.Domain.Dto;

public class OrderDto
{
    public Guid OrderId { get; set; }
    public List<BookingDto> Bookings { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public OrderStatus Status { get; set; }
}
using MediatR;

namespace Flights.Application.Features.Orders.CreateOrder;

public class CreateOrderCommand : IRequest<Guid>
{
    public Guid UserId { get; set; }
    public List<BookingData> Bookings { get; set; }
}

public record BookingData
{
    public Guid PassengerId { get; set; }
    public string SeatNumber { get; set; }
    public bool HasLuggage { get; set; } = false;
    public bool HasFood { get; set; } = false;
    public bool IsBusiness { get; set; } = false; 
    public Guid FlightId { get; set; }
}
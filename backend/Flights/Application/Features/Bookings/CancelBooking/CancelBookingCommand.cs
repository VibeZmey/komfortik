using MediatR;

namespace Flights.Application.Features.Bookings.CancelBooking;

public class CancelBookingCommand : IRequest<Unit>
{
    public Guid BookingId { get; set; }
}
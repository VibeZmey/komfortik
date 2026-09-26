using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Bookings.ConfirmBooking;

public class ConfirmBookingsCommand : IRequest<Unit>
{
    public List<Guid> BookingIds { get; set; } = [];
}
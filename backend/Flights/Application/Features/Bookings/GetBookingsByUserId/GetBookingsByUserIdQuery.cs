using Flights.Domain.Dto;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Bookings.GetBookingsByUserId;

public class GetBookingsByUserIdQuery : IRequest<IReadOnlyCollection<BookingDto>>
{
    public Guid UserId { get; set; }
}
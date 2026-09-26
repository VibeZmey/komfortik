using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Bookings.GetBookingsByUserId;

public class GetBookingsByUserIdHandler 
    : IRequestHandler<GetBookingsByUserIdQuery, IReadOnlyCollection<BookingDto>>
{
    private readonly IBookingRepository _bookingRepo;

    public GetBookingsByUserIdHandler(IBookingRepository bookingRepository)
    {
        _bookingRepo = bookingRepository;
    }
    
    public async Task<IReadOnlyCollection<BookingDto>> Handle(GetBookingsByUserIdQuery request, CancellationToken cancellationToken)
    {
        return await _bookingRepo.GetAllByUserIdAsync(request.UserId, cancellationToken);
    }
}
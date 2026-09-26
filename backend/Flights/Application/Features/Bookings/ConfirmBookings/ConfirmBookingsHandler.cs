using Flights.Application.Features.Bookings.ConfirmBooking;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Bookings.ConfirmBookings;

public class ConfirmBookingsHandler : IRequestHandler<ConfirmBookingsCommand, Unit>
{
    private readonly IBookingRepository _bookingRepo;
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmBookingsHandler(IBookingRepository bookingRepository,
        IUnitOfWork unitOfWork)
    {
        _bookingRepo = bookingRepository;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Unit> Handle(ConfirmBookingsCommand request, CancellationToken cancellationToken)
    {
        foreach (var bookingId in request.BookingIds)
        {
            var booking = await _bookingRepo
                .GetByIdWithDetailsAsync(bookingId, cancellationToken);
            if (booking is null)
                throw new ApplicationException("Booking not found");
            booking.Confirm();
        }
        
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
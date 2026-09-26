using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Bookings.CancelBooking;

public class CancelBookingHandler : IRequestHandler<CancelBookingCommand, Unit>
{
    private readonly IBookingRepository _bookingRepo;
    private readonly IFlightRepository _flightRepo;
    private readonly IUnitOfWork _unitOfWork;
    
    
    public CancelBookingHandler(
        IBookingRepository repository, 
        IFlightRepository flightRepository,
        IUnitOfWork unitOfWork)
    {
        _bookingRepo = repository;
        _flightRepo = flightRepository;
        _unitOfWork = unitOfWork;
    }
    public async Task<Unit> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepo.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking is null)
            throw new ApplicationException("Booking not found");
        
        booking.Cancel();
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
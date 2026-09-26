using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Passengers.DeletePassenger;

public class DeletePassengerHandler : IRequestHandler<DeletePassengerCommand, Unit>
{
    private readonly IPassengerRepository _passengerRepo;
    private readonly IUnitOfWork _unitOfWork;

    public DeletePassengerHandler(
        IPassengerRepository passengerRepo,
        IUnitOfWork unitOfWork)
    {
        _passengerRepo = passengerRepo;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Unit> Handle(DeletePassengerCommand request, CancellationToken cancellationToken)
    {
        var passenger = await _passengerRepo
            .GetByIdWithDetailsAsync(request.PassengerId, cancellationToken);
        if (passenger is null)
            throw new ApplicationException("Passenger not found");

        if (!passenger.Bookings.Any())
            _passengerRepo.Delete(passenger);
        else
            passenger.Unsave();
        
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
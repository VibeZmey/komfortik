using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Passengers.UpdatePassengerInfo;

public class UpdatePassengerInfoHandler : IRequestHandler<UpdatePassengerInfoCommand, UpdatePassengerDto>
{
    private readonly IPassengerRepository _passengerRepo;
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePassengerInfoHandler(
        IPassengerRepository passengerRepo,
        IUnitOfWork unitOfWork)
    {
        _passengerRepo = passengerRepo;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<UpdatePassengerDto> Handle(UpdatePassengerInfoCommand request, CancellationToken cancellationToken)
    {
        var passenger = await _passengerRepo
            .GetByIdAsync(request.Id, cancellationToken);
        if (passenger is null)
            throw new ApplicationException("Passenger not found");
        
        passenger.Update(
            request.Email, 
            request.PhoneNumber);

        await _unitOfWork.SaveAsync(cancellationToken);
        return UpdatePassengerDto.Map(passenger);
    }
}
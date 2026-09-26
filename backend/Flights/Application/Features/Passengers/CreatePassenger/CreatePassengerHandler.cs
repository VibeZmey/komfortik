using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Passengers.CreatePassenger;

public class CreatePassengerHandler 
    : IRequestHandler<CreatePassengerCommand, CreatePassengerDto>
{
    private readonly IPassengerRepository _passengerRepo;
    private readonly IUnitOfWork _unitOfWork;
    public CreatePassengerHandler(
        IPassengerRepository pasRepo, 
        IUnitOfWork unitOfWork)
    {
        _passengerRepo = pasRepo;    
        _unitOfWork = unitOfWork;
    }
    
    public async Task<CreatePassengerDto> Handle(CreatePassengerCommand request, CancellationToken cancellationToken)
    {
        var pas = Passenger.Create(
            request.UserId,
            request.Type,
            request.IsSaved
            );
        
        await _passengerRepo.AddAsync(pas, cancellationToken);
        await _unitOfWork.SaveAsync(cancellationToken);
        return CreatePassengerDto.Map(pas);
    }
}
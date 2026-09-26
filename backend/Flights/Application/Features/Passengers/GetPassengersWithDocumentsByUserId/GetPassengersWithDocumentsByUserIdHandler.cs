using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Passengers.GetPassengersWithDocumentsByUserId;

public class GetPassengersWithDocumentsByUserIdHandler
    : IRequestHandler<GetPassengersWithDocumentsByUserIdQuery, IReadOnlyCollection<PassengerWithDocumentsDto>>
{
    private readonly IPassengerRepository _passengerRepo;
    private readonly IUnitOfWork _unitOfWork;
    
    public GetPassengersWithDocumentsByUserIdHandler(
        IPassengerRepository pasRepo, 
        IUnitOfWork unitOfWork)
    {
        _passengerRepo = pasRepo;    
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyCollection<PassengerWithDocumentsDto>> Handle(GetPassengersWithDocumentsByUserIdQuery request, CancellationToken cancellationToken)
    {
        return await _passengerRepo.GetPassengersWithDocumentsByUserId(request.UserId, cancellationToken);
    }
}
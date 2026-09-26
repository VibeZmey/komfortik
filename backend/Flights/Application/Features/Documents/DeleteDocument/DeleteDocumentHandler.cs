using Flights.Application.Features.Documents.DeleteDocumet;
using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Documents.DeleteDocument;

public class DeleteDocumentHandler : IRequestHandler<DeleteDocumentCommand, Unit>
{
    private readonly IDocumentRepository _documentRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPassengerRepository _passengerRepo;

    public DeleteDocumentHandler(
        IDocumentRepository documentRepo,
        IUnitOfWork unitOfWork,
        IPassengerRepository passengerRepo)
    {
        _unitOfWork = unitOfWork;
        _documentRepo = documentRepo;
        _passengerRepo = passengerRepo;
    }
    
    public async Task<Unit> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _documentRepo
            .GetByIdAsync(request.DocumentId, cancellationToken);
        if (document is null)
            throw new ApplicationException("Document not found");
        
        var passenger = await _passengerRepo
            .GetByIdWithDetailsAsync(document.PassengerId, cancellationToken);
        if(passenger is null)
            throw new ApplicationException("Passenger not found");
        
        passenger.DeleteDocument(document);
        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
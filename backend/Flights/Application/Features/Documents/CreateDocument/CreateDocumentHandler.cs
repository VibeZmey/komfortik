using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Documents.CreateDocument;

public class CreateDocumentHandler : IRequestHandler<CreateDocumentCommand, CreateDocumentDto>
{
    private readonly IEncryptionService _encryptionService;
    private readonly IDocumentRepository _documentRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPassengerRepository _passengerRepo;
    
    public CreateDocumentHandler(
        IEncryptionService encryptionService, 
        IDocumentRepository documentRepo,
        IUnitOfWork unitOfWork,
        IPassengerRepository passengerRepo)
    {
        _encryptionService = encryptionService;
        _documentRepo = documentRepo;
        _unitOfWork = unitOfWork;
        _passengerRepo = passengerRepo;
    }
    public async Task<CreateDocumentDto> Handle(CreateDocumentCommand request, CancellationToken cancellationToken)
    {
        var passenger = await _passengerRepo
            .GetByIdWithDetailsAsync(request.PassengerId, cancellationToken);
        if (passenger is null)
            throw new ApplicationException($"Passenger not found");
        
        var document = Document.Create(
            request.Type, 
            request.FirstName,
            request.MiddleName,
            request.LastName,
            request.Number,
            request.Series,
            request.Gender,
            request.DateOfBirth,
            request.ValidityPeriod,
            request.PassengerId,
            request.UserId);
        
        var encryptedSeries = document.Series is not null ?
            _encryptionService.Encrypt(document.Series) : null;
        
        var encryptedNumber = _encryptionService.Encrypt(document.Number);
        document.SetEncryptedData(encryptedNumber, encryptedSeries);
        
        passenger.AddDocument(document);
        await _unitOfWork.SaveAsync(cancellationToken);
        return CreateDocumentDto.Map(document);
    }
}
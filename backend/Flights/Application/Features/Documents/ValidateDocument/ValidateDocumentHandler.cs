using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Documents.ValidateDocument;

public class ValidateDocumentHandler : IRequestHandler<ValidateDocumentCommand, bool>
{
    private readonly IPassengerRepository _passengerRepo;

    public ValidateDocumentHandler(IPassengerRepository passengerRepo)
    {
        _passengerRepo = passengerRepo;
    }
    
    public Task<bool> Handle(ValidateDocumentCommand request, CancellationToken cancellationToken)
    {
        Document.Create(
            request.Type, 
            request.FirstName,
            request.MiddleName,
            request.LastName,
            request.Number,
            request.Series,
            request.Gender,
            request.DateOfBirth,
            request.ValidityPeriod,
            Guid.NewGuid(),
            request.UserId);
        return Task.FromResult(true);
    }
}
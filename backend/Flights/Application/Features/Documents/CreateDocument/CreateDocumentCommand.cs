using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Documents.CreateDocument;

public record CreateDocumentCommand : IRequest<CreateDocumentDto>
{
    public DocumentType Type { get; set; }
    
    public string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string LastName { get; set; }
    
    public string Number { get; set; }
    public string? Series { get; set; }
    public Gender Gender { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime? ValidityPeriod { get; set; }
    public Guid PassengerId { get; set; }
    public Guid UserId { get; set; }
}
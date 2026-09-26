using Flights.Domain.Models;
using Microsoft.OpenApi;

namespace Flights.Application.Features.Documents.CreateDocument;

public record CreateDocumentDto
{
    public Guid Id { get; set; }
    public DocumentType Type { get; set; }
    public string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string LastName { get; set; }
    public Gender Gender { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime? ValidityPeriod { get; set; }
    public Guid PassengerId { get; set; }
    public Guid UserId { get; set; }

    public static CreateDocumentDto Map(Document document)
    {
        return new CreateDocumentDto
        {
            Id = document.Id,
            Type = document.Type,
            FirstName = document.FirstName,
            MiddleName = document.MiddleName,
            LastName = document.LastName,
            Gender = document.Gender,
            DateOfBirth = document.DateOfBirth,
            ValidityPeriod = document.ValidityPeriod,
            PassengerId = document.PassengerId,
            UserId = document.UserId
        };
    }
}
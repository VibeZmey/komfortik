using System.Text.Json.Serialization;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Documents.UpdateDocument;

public class UpdateDocumentCommand : IRequest<UpdateDocumentDto>
{
    [JsonIgnore]
    public Guid Id { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Number { get; set; }
    public string? Series { get; set; }
    public Gender? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? ValidityPeriod { get; set; }
}
using Flights.Domain.Models;

namespace Flights.Domain.Dto;

public record DocumentsByUserDto
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
}
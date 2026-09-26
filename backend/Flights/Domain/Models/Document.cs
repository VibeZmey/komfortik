using Flights.Domain.Exceptions;
using Flights.Domain.Validators;
using Microsoft.EntityFrameworkCore;

namespace Flights.Domain.Models;

public class Document
{
    public Guid Id { get; private set; }
    public DocumentType Type { get; private set; }
    
    public string FirstName { get; private set; }
    public string? MiddleName { get; private set; }
    public string LastName { get; private set; }
    
    public string Number { get; private set; }
    public string? Series { get; private set; }
    public Gender Gender { get; private set; }
    public DateTime DateOfBirth { get; private set; }
    public DateTime? ValidityPeriod { get; private set; }
    
    public Guid PassengerId { get; private set; }
    public Passenger Passenger { get; private set; }
    
    public Guid UserId { get; private set; }
    private Document() {}
    
    public static bool Validate(Document document)
    {
        
        if (document.Type == DocumentType.Passport)
        {
            if (string.IsNullOrWhiteSpace(document.Series))
                throw new DomainException("Series is required for passport");

            if (!DocumentValidators.PassportSeriesRegex.IsMatch(document.Series))
                throw new DomainException("Invalid passport series format (expected 4 digits)");

            if (!DocumentValidators.PassportOrBirthCertificateNumberRegex.IsMatch(document.Number))
                throw new DomainException("Invalid passport number format (expected 6 digits)");
        }
        else if (document.Type == DocumentType.ForeignPassport)
        {
            if(string.IsNullOrWhiteSpace(document.Series))
                throw new DomainException("Series is required for foreign passport");
                
            if (!DocumentValidators.ForeignPassportSeriesRegex.IsMatch(document.Series))
                throw new DomainException("Invalid foreign passport series format");

            if (!DocumentValidators.ForeignPassportNumberRegex.IsMatch(document.Number))
                throw new DomainException("Invalid foreign passport number format");
        }
        else if (document.Type == DocumentType.BirthCertificate)
        {
            if (string.IsNullOrWhiteSpace(document.Series))
                throw new DomainException("Series is required for birth certificate");

            if (!DocumentValidators.BirthCertificateSeriesRegex.IsMatch(document.Series))
                throw new DomainException("Invalid birth certificate series format (e.g., I-МЮ)");

            if (!DocumentValidators.PassportOrBirthCertificateNumberRegex.IsMatch(document.Number))
                throw new DomainException("Invalid birth certificate number format (expected 6 digits)");
        }
        if (document.Type == DocumentType.BirthCertificate && 
            DateTime.UtcNow.AddYears(-14) > document.DateOfBirth)
            throw new DomainException("From the age of 14 you cannot fly with a birth certificate");

        if (document.DateOfBirth >= DateTime.UtcNow)
            throw new DomainException("Invalid date of birth");

        if (document.ValidityPeriod is not null && document.ValidityPeriod < DateTime.UtcNow)
            throw new DomainException("Document has expired");

        return true;
    }

    public static void Update(
        Document document,
        string? firstName,
        string? middleName,
        string? lastName,
        string number,
        string? series,
        Gender? gender,
        DateTime? dateOfBirth,
        DateTime? validityPeriod)
    {
        document.FirstName = firstName ?? document.FirstName;
        document.MiddleName = middleName ?? document.MiddleName;
        document.LastName = lastName ?? document.LastName;
        document.Number = number;
        document.Series = series;
        document.Gender = gender ?? document.Gender;
        document.DateOfBirth = dateOfBirth ?? document.DateOfBirth;
        document.ValidityPeriod =  validityPeriod ?? document.ValidityPeriod;
        Validate(document);
    }
    
    public static Document Create(
        DocumentType type,
        string firstName,
        string? middleName,
        string lastName,
        string number,
        string? series,
        Gender gender,
        DateTime dateOfBirth,
        DateTime? validityPeriod,
        Guid passengerId,
        Guid userId
        )
    {
        Document result = new Document
        {
            Id = Guid.NewGuid(),
            Series = series,
            Number = number,
            Type = type,
            DateOfBirth = dateOfBirth,
            MiddleName = middleName,
            FirstName = firstName,
            LastName = lastName,
            Gender = gender,
            PassengerId = passengerId,
            UserId = userId,
            ValidityPeriod = validityPeriod
        };
        Validate(result);
        return result;
    } 
    
    public void SetEncryptedData(string number, string? series)
    {
        Series = series;
        Number = number;
    }
}

public enum DocumentType
{
    Passport,
    ForeignPassport,
    BirthCertificate,
    Other
}

public enum Gender
{
    Male,
    Female
}
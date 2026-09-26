namespace Flights.Domain.Exceptions;

public class DomainException : Exception
{
    public string ErrorCode { get; }
    public Dictionary<string, string[]> Errors { get; }

    public DomainException(string message) 
        : base(message)
    {
        ErrorCode = "DOMAIN_ERROR";
        Errors = new Dictionary<string, string[]>();
    }

    public DomainException(string message, string errorCode) 
        : base(message)
    {
        ErrorCode = errorCode;
        Errors = new Dictionary<string, string[]>();
    }

    public DomainException(string message, Dictionary<string, string[]> errors) 
        : base(message)
    {
        ErrorCode = "VALIDATION_ERROR";
        Errors = errors;
    }
}
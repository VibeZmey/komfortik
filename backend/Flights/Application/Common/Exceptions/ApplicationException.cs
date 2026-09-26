namespace Flights.Application.Common.Exceptions;

public class ApplicationException : Exception
{
    public string ErrorCode { get; }
    public Dictionary<string, string[]> Errors { get; }

    public ApplicationException(string message) 
        : base(message)
    {
        ErrorCode = "APPLICATION_ERROR";
        Errors = new Dictionary<string, string[]>();
    }

    public ApplicationException(string message, string errorCode) 
        : base(message)
    {
        ErrorCode = errorCode;
        Errors = new Dictionary<string, string[]>();
    }

    public ApplicationException(string message, Dictionary<string, string[]> errors) 
        : base(message)
    {
        ErrorCode = "VALIDATION_ERROR";
        Errors = errors;
    }
}
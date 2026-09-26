namespace Identity.Exceptions;

public class AlreadyExistException : Exception
{
    public AlreadyExistException(string message) : base(message) { }

    public AlreadyExistException(string objectName, string key) :
        base($"{objectName}: {key} is already exist.") { }
}
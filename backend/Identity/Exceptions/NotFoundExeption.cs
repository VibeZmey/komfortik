namespace Identity.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string objectName, string key) :
        base($"{objectName} : {key} was not found.") { }
}
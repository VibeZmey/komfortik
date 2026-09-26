namespace Identity.Exceptions;

public class UserWasBlockedException : Exception
{
    public UserWasBlockedException(string login) :
        base($"User: {login} was blocked") { }
}
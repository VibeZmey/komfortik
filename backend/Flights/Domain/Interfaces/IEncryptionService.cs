namespace Flights.Domain.Interfaces;

public interface IEncryptionService
{
    string Encrypt(string str);
    string Decrypt(string str);
}
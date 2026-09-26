using System.Security.Cryptography;
using System.Text;
using Flights.Domain.Interfaces;

namespace Flights.Infrastructure.Services;

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;

    public EncryptionService(IConfiguration configuration)
    {
        var key = configuration["Encryption:Key"];
        _key = Convert.FromBase64String(key);
    }
    
    public string Encrypt(string str)
    {
        using var aes = new AesGcm(_key, 16);
        var nonce = new byte[12];
        RandomNumberGenerator.Fill(nonce);
        
        var plaintext = Encoding.UTF8.GetBytes(str);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];

        aes.Encrypt(nonce, plaintext, ciphertext, tag);

        var result = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, result, nonce.Length + tag.Length, ciphertext.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string str)
    {
        var data = Convert.FromBase64String(str);

        var nonce = new byte[12];
        var tag = new byte[16];
        var ciphertext = new byte[data.Length - 12 - 16];

        Buffer.BlockCopy(data, 0, nonce, 0, 12);
        Buffer.BlockCopy(data, 12, tag, 0, 16);
        Buffer.BlockCopy(data, 12 + 16, ciphertext, 0, ciphertext.Length);

        using var aes = new AesGcm(_key, 16);
        var plaintext = new byte[ciphertext.Length];

        aes.Decrypt(nonce, ciphertext, tag, plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }
}
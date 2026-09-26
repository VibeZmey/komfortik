namespace Mail.Interfaces;

public interface IMinioFileService
{
    Task<byte[]?> DownloadFileAsync(string fileName, CancellationToken ct = default);
}
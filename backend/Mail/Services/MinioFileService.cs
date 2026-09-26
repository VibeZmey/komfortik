// Mail/Services/MinioFileService.cs

using Mail.Interfaces;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Options;
using Mail.Options;

namespace Mail.Services;

public class MinioFileService : IMinioFileService
{
    private readonly IMinioClient _minio;
    private readonly MinioOptions _options;
    private readonly ILogger<MinioFileService> _logger;

    public MinioFileService(
        IMinioClient minio,
        IOptions<MinioOptions> options,
        ILogger<MinioFileService> logger)
    {
        _minio = minio;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<byte[]?> DownloadFileAsync(string fileName, CancellationToken ct = default)
    {
        try
        {
            using var ms = new MemoryStream();
            
            var args = new GetObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(fileName)
                .WithCallbackStream(stream => stream.CopyTo(ms));
            
            await _minio.GetObjectAsync(args, ct);
            return ms.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download {FileName} from bucket {Bucket}", 
                fileName, _options.BucketName);
            return null;
        }
    }
}
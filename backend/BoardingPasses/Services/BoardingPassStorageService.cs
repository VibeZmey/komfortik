using BoardingPasses.Options;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace BoardingPasses.Services;

public interface IBoardingPassStorageService
{
    Task UploadAsync(byte[] content, string objectName, CancellationToken ct = default);
}

public class BoardingPassStorageService : IBoardingPassStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly MinioOptions _options;
    private readonly ILogger<BoardingPassStorageService> _logger;
    private bool _bucketChecked;
    private readonly SemaphoreSlim _bucketLock = new(1, 1);

    public BoardingPassStorageService(IOptions<MinioOptions> options, ILogger<BoardingPassStorageService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _minioClient = new MinioClient()
            .WithEndpoint(_options.Endpoint)
            .WithCredentials(_options.AccessKey, _options.SecretKey)
            .WithSSL(_options.Secure)
            .Build();
    }

    public async Task UploadAsync(byte[] content, string objectName, CancellationToken ct = default)
    {
        await EnsureBucketExistsAsync(ct);

        await using var stream = new MemoryStream(content);
        await _minioClient.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_options.BucketName)
            .WithObject(objectName)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType("application/pdf"), ct);

        _logger.LogInformation("Uploaded boarding pass PDF to MinIO as {ObjectName}", objectName);
    }

    private async Task EnsureBucketExistsAsync(CancellationToken ct)
    {
        if (_bucketChecked)
            return;

        await _bucketLock.WaitAsync(ct);
        try
        {
            if (_bucketChecked)
                return;

            var exists = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(_options.BucketName), ct);
            if (!exists)
            {
                await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(_options.BucketName), ct);
            }

            _bucketChecked = true;
        }
        finally
        {
            _bucketLock.Release();
        }
    }
}


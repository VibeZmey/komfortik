using Flights.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;

namespace Flights.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly ILogger<CacheService> _logger;
    private readonly IDistributedCache _redisCache;

    public CacheService(
        IDistributedCache redisCache,
        ILogger<CacheService> logger)
    {
        _redisCache = redisCache;
        _logger = logger;
    }
    
    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        try
        {
            var valueJson = await _redisCache.GetStringAsync(key, ct);
            return String.IsNullOrEmpty(valueJson)
                ? default
                : JsonConvert.DeserializeObject<T>(valueJson);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache read failed for key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default)
    {
        var valueJson = JsonConvert.SerializeObject(value);
        try
        {
            await _redisCache.SetStringAsync(key, valueJson, 
                new DistributedCacheEntryOptions()
                {
                    AbsoluteExpirationRelativeToNow = ttl
                    
                }, ct);
        }catch(Exception ex)
        {
            _logger.LogWarning(ex, "Cache write failed for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await _redisCache.RemoveAsync(key, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache remove failed for key {Key}", key);
        }
    }
}
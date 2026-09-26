using System.Text.Json;
using Confluent.Kafka;
using Flights.Application.Common.Interfaces;

namespace Flights.Infrastructure.Services;

public class Publisher : IPublisher
{
    private readonly IProducer<string, string> _producer;
    private readonly JsonSerializerOptions _json;
    private readonly ILogger<Publisher> _logger;

    public Publisher(
        IProducer<string, string> producer, 
        JsonSerializerOptions json,
        ILogger<Publisher> logger)
    {
        _producer = producer;
        _json = json;
        _logger = logger;
    }

    public async Task PublishAsync<T>(string topic, string key, T message, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(message, _json);
        
        await _producer.ProduceAsync(topic, new Message<string, string>
        {
            Key = key,
            Value = payload
        }, ct);
    }
}
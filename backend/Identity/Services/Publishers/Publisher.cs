using System.Text.Json;
using Confluent.Kafka;

namespace Identity.Services.Publishers;

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

    public Task PublishAsync<T>(string topic, string key, T message, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(message, _json);
        _logger.LogInformation("Message published: topic={Topic}, key={Key}", topic, key);
        return _producer.ProduceAsync(topic, new Message<string, string>
        {
            Key = key,
            Value = payload
        }, ct);
    }
}
using System.Text.Json;
using Confluent.Kafka;

namespace BoardingPasses.Publishers;

public class Publisher
{
    private readonly IProducer<string, string> _producer;
    private readonly JsonSerializerOptions _json;

    public Publisher(IProducer<string, string> producer, JsonSerializerOptions json)
    {
        _producer = producer;
        _json = json;
    }

    public Task PublishAsync<T>(string topic, string key, T message, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(message, _json);

        return _producer.ProduceAsync(topic, new Message<string, string>
        {
            Key = key,
            Value = payload
        }, ct);
    }
}
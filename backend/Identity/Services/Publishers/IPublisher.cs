namespace Identity.Services.Publishers;

public interface IPublisher
{
    Task PublishAsync<T>(string topic, string key, T message, CancellationToken ct = default);
}
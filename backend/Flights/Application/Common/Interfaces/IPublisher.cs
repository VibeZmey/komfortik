namespace Flights.Application.Common.Interfaces;

public interface IPublisher
{
    Task PublishAsync<T>(string topic, string key, T message, CancellationToken ct = default);
}
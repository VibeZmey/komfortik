namespace Flights.Infrastructure.Options;

public class RabbitMqSettings
{
    public string HostName { get; set; }
    public int Port { get; set; }
    public string UserName { get; set; }
    public string Password { get; set; }
    public string ExchangeName { get; set; }
    public Dictionary<string, string> Queues { get; set; }
    public Dictionary<string, string> RoutingKeys { get; set; }
}
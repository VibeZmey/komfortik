namespace Flights.Domain.Models;

public class OutboxMessage
{
    public Guid Id { get; set; }
    public string Type { get; set; }
    public string Data { get; set; }
    public DateTime OccurredOn { get; private set; }
    public bool Processed { get; set; } = false;
    public int Retries { get; set; } = 0;
    public string? LastError { get; set; }
    //TODO: мб добавить приоритет типо на checkin пофиг, может и подождать а на отправку билета уже как будто нет

    public static OutboxMessage Create(string type, string data)
    {
        return new OutboxMessage()
        {
            Id = Guid.NewGuid(),
            Type = type,
            Data = data,
            OccurredOn = DateTime.UtcNow,
        };
    }
}
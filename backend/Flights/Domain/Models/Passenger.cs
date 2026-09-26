using System.Text.Json.Serialization;

namespace Flights.Domain.Models;

public class Passenger
{
    public Guid Id { get; private set; }
    //TODO: сделать так чтобы тип указывал не пользователь а он сам вычислялся
    public PassengerType Type { get; private set; }
    public ICollection<Document> Documents { get; private set; }
    public ICollection<Booking> Bookings { get; private set; }
    public Guid UserId { get; private set; }
    public bool IsSaved { get; private set; } = false;
    private Passenger() {}

    public void Save() => IsSaved = true;
    public void Unsave() => IsSaved = false;

    public void AddDocument(Document document)
    {
        //TODO: возможно сделать какую то валидацию количества документов, одно свидетельство и тд
        Documents.Add(document);
    }

    public void DeleteDocument(Document document)
    {
        Documents.Remove(document);
    }

    public void Update(
        string? email, 
        string? phoneNumber)
    {
        //TODO: придумать че с этим делать
    }
    
    public static Passenger Create(
        Guid userId,
        PassengerType type,
        bool isSaved,
        string? email = null,
        string? phoneNumber = null)
    {
        //TODO: Валидация почты и телефона
        return new Passenger
        {
            Id = Guid.NewGuid(),
            Type = type,
            UserId = userId,
            IsSaved = isSaved
        };
    }
}

public enum PassengerType
{
    Adult,
    Kid,
    Baby,
    None
}
using Flights.Domain.Dto;
using Flights.Domain.Exceptions;

namespace Flights.Domain.Models;

public class Booking
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    
    public Guid OrderId { get; private set; }
    public Order Order { get; private set; }
    public Guid PassengerId { get; private set; }
    public Passenger Passenger { get; private set; }
    public string SeatNumber { get; private set; }
    public Guid FlightId { get; private set; }
    public Flight Flight { get; private set; }
    public bool HasLuggage { get; private set; } = false;
    public bool HasFood { get; private set; } = false;
    public bool IsBusiness { get; private set; } = false;
    public decimal TotalPrice { get; private set; }
    public BookingStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Booking(){}

    public static BookingDto ToDto(Booking booking)
    {
        //TODO: написал что то странное, если что пидумать как пофиксить, не придумал как грамотно сделать вывод имени в дто если у пассажира много документов но в моей теории они все передаются туда куда он летит, мб фикс мб нет
        var document = booking.Passenger.Documents.FirstOrDefault();
        if(document == null)
            throw new DomainException("Passenger does not have the necessary documents");
            
        return new BookingDto()
        {
            Id = booking.Id,
            FirstName = document.FirstName,
            LastName = document.LastName,
            MiddleName = document.MiddleName,
            SeatNumber = booking.SeatNumber,
            Flight = Flight.ToFlightForBooking(booking.Flight),
            HasLuggage = booking.HasLuggage,
            HasFood = booking.HasFood,
            IsBusiness = booking.IsBusiness,
            TotalPrice = booking.TotalPrice,
            Status = booking.Status,
            CreatedAt = booking.CreatedAt,
        };
    }
    public static Booking Create(
        Guid userId,
        Guid orderId,
        Passenger passenger,
        string seatNumber,
        Flight flight)
    {
        decimal price = flight.FlightPrice;
        switch (passenger.Type)
        {
            case PassengerType.Baby:
                price = 0;
                break;
        }
        
        return new Booking
        {
            // В этом месте стоит Guid.Empty потому что иначе ef определяет
            // эту сущность как существующую и при ее добавлении создает
            // UPDATE запрос, а не INSERT
            Id = Guid.Empty,
            OrderId = orderId,
            UserId = userId,
            PassengerId = passenger.Id,
            FlightId = flight.Id,
            SeatNumber = seatNumber,
            Status = BookingStatus.Pending,
            TotalPrice = price,
            CreatedAt = DateTime.UtcNow,
        };
    }
    
    public void AddLuggage(decimal luggagePrice)
    {
        if (Status != BookingStatus.Pending)
            throw new DomainException("Confirmed bookings cannot be changed");
            
        if (HasLuggage) return;
        
        HasLuggage = true;
        TotalPrice += luggagePrice;
    }

    public void AddFood(decimal foodPrice)
    {
        if (Status != BookingStatus.Pending)
            throw new DomainException("Confirmed bookings cannot be changed");

        if (HasFood) return;

        HasFood = true;
        TotalPrice += foodPrice;
    }
    
    public void UpgradeToBusiness(decimal upgradePrice, PassengerType passengerType)
    {
        if (Status != BookingStatus.Pending)
            throw new DomainException("Confirmed bookings cannot be changed");

        if (IsBusiness) return;

        IsBusiness = true;
        
        switch (passengerType)
        {
            case PassengerType.Adult:
                TotalPrice += upgradePrice;
                break;
            case PassengerType.Kid:
                TotalPrice += upgradePrice/2;
                break;
        }
    }

    public void Confirm()
    {
        if (Status != BookingStatus.Pending)
            throw new DomainException("Reservation has already been processed");
        
        Status = BookingStatus.Confirmed;
    }

    public void Cancel()
    {
        if (Status == BookingStatus.Cancelled)
            throw new DomainException("Already canceled");
        
        if (Status == BookingStatus.Departed)
            throw new DomainException("Flight departed");
        
        Status = BookingStatus.Cancelled;
    }
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Expired,
    Departed
}
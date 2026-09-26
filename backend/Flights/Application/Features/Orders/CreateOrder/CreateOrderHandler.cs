using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using MediatR;

namespace Flights.Application.Features.Orders.CreateOrder;

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IFlightRepository _flightRepo;
    private readonly IPassengerRepository _passengerRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderRepository _orderRepo;

    public CreateOrderHandler(
        IFlightRepository flightRepository,
        IPassengerRepository passengerRepository,
        IUnitOfWork unitOfWork,
        IOrderRepository orderRepository)
    {
        _flightRepo = flightRepository;
        _passengerRepo = passengerRepository;
        _unitOfWork = unitOfWork;
        _orderRepo = orderRepository;
    }
    
    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var order = Order.Create(request.UserId);
        
        foreach (var data in request.Bookings)
        {
            var flight = await _flightRepo
                .GetByIdAsync(data.FlightId, cancellationToken);
            if(flight is null)
                throw new ApplicationException("Flight not found");
            
            var passenger = await _passengerRepo
                .GetByIdAsync(data.PassengerId, cancellationToken);
            if(passenger is null)
                throw new ApplicationException("Passenger not found");

            var booking = Booking.Create(
                request.UserId, 
                order.Id,
                passenger, 
                data.SeatNumber, 
                flight);
        
            if(data.IsBusiness) booking
                .UpgradeToBusiness(flight.BusinessPrice, passenger.Type);
        
            if(data.HasFood) 
                booking.AddFood(flight.FoodPrice);
        
            if(data.HasLuggage) 
                booking.AddLuggage(flight.LuggagePrice);
            
            flight.AddBooking(booking);
            order.AddBooking(booking);
        }
        
        await _orderRepo.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveAsync(cancellationToken);
        return order.Id;
    }
}
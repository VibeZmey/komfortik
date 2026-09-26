using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using MassTransit.Initializers;
using Microsoft.EntityFrameworkCore;
using SharedContracts.Messages;

namespace Flights.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly FlightsDbContext _context;

    public OrderRepository(FlightsDbContext context)
    {
        _context = context;
    }

    public async Task<List<BoardingPass>> GetOrderForBoardingPassesAsync(Guid id, CancellationToken ct)
    {
        var dtos = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.OrderId == id)
            .Select(b => new BoardingPass
            {
                Id = b.Id,
                PassengerFirstName = b.Passenger.Documents.FirstOrDefault().FirstName,
                PassengerMiddleName = b.Passenger.Documents.FirstOrDefault().MiddleName,
                PassengerLastName = b.Passenger.Documents.FirstOrDefault().LastName,
        
                SeatNumber = b.SeatNumber,
                Price = b.TotalPrice,
                HasLuggage = b.HasLuggage,
                HasFood = b.HasFood,
                IsBusiness = b.IsBusiness,
                Status = b.Status.ToString(),
                FlightNumber = b.Flight.Number,
        
                DepartureTime = b.Flight.DepartureTime,
                ArrivalTime = b.Flight.ArrivalTime,
                DepartureOffset = b.Flight.FromAirport.TimezoneOffset,
                ArrivalOffset = b.Flight.ToAirport.TimezoneOffset,
        
                DepartureCity = b.Flight.FromAirport.City,
                ArrivalCity = b.Flight.ToAirport.City,
                AirplaneModel = b.Flight.Airplane.Name,
                BookingCreatedAt = b.CreatedAt
            })
            .ToListAsync(ct);
        
        foreach (var dto in dtos)
        {
            dto.DepartureTime = dto.DepartureTime.AddHours(dto.DepartureOffset);
            dto.ArrivalTime = dto.ArrivalTime.AddHours(dto.ArrivalOffset);
        }

        return dtos;
    }
    
    public async Task<List<OrderDto>> GetAllOrdersAsync(CancellationToken ct = default)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Bookings)
            .ThenInclude(b => b.Flight)
            .ThenInclude(f => f.FromAirport)
            .Include(o => o.Bookings)
            .ThenInclude(b => b.Flight)
            .ThenInclude(f => f.ToAirport)
            .Include(o => o.Bookings)
            .ThenInclude(b => b.Flight)
            .ThenInclude(f => f.Airplane)
            .ThenInclude(a => a.Airline)
            .Include(o => o.Bookings)
            .ThenInclude(b => b.Passenger)
            .ThenInclude(p => p.Documents)
            .ToListAsync(ct);
    
        return orders.Select(Order.ToDto).ToList();
    }

    public async Task<List<OrderDto>> GetOrdersByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Flight)
                    .ThenInclude(f => f.FromAirport)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Flight)
                    .ThenInclude(f => f.ToAirport)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Flight)
                    .ThenInclude(f => f.Airplane)
                        .ThenInclude(a => a.Airline)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Passenger)
                    .ThenInclude(p => p.Documents)
            .ToListAsync(ct);
    
        return orders.Select(Order.ToDto).ToList();
    }

    public async Task AddAsync(Order order, CancellationToken ct)
    {
        await _context.Orders.AddAsync(order, ct);
    }

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Orders
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Flight)
                    .ThenInclude(f => f.FromAirport)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Flight)
                    .ThenInclude(f => f.ToAirport)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Flight)
                    .ThenInclude(f => f.Airplane)
                        .ThenInclude(a => a.Airline)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Passenger)
                    .ThenInclude(p => p.Documents)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task UpdateAsync(Order order, CancellationToken ct)
    {
        _context.Orders.Update(order);
        await Task.CompletedTask;
    }
}
using System.Runtime.CompilerServices;
using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly FlightsDbContext _context;
    private readonly IFlightRepository _flightRepo;

    public BookingRepository(
        FlightsDbContext context,
        IFlightRepository flightRepo)
    {
        _context = context;
        _flightRepo = flightRepo;
    }
    public async Task AddAsync(Booking booking, CancellationToken ct = default)
    {
        await _context.Bookings.AddAsync(booking, ct);
    }

    public async Task<Booking?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Bookings
            .Include(b => b.Passenger)
            .Include(b => b.Flight)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
    }
    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == id, ct);
    }
    public async Task<IReadOnlyCollection<BookingDto>> GetAllByUserIdAsync(Guid userId,CancellationToken ct = default)
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .Include(b => b.Flight)
                .ThenInclude(f => f.FromAirport)
            .Include(b => b.Flight)
                .ThenInclude(f => f.ToAirport)
            .Include(b => b.Flight)
                .ThenInclude(f => f.Airplane) 
                .ThenInclude(a => a.Airline)
            .Include(b => b.Passenger)
                .ThenInclude(p => p.Documents)
            .ToListAsync(ct);
        
        return bookings.Select(b => Booking.ToDto(b)).ToList();
    }
}
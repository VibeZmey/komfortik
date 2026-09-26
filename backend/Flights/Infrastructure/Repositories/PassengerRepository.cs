using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Repositories;

public class PassengerRepository : IPassengerRepository
{
    private readonly FlightsDbContext _context;

    public PassengerRepository(FlightsDbContext context)
    {
        _context = context;
    }
    
    public async Task AddAsync(Passenger passenger, CancellationToken ct = default)
    {
        await _context
            .Passengers
            .AddAsync(passenger, ct);
    }

    public void Update(Passenger passenger)
    {
        var pas = _context
            .Passengers
            .Local
            .FirstOrDefault(p => p.Id == passenger.Id);

        if (pas is not null)
            _context.Entry(pas).CurrentValues.SetValues(passenger);
        else
            _context.Passengers.Update(passenger);
    }

    public void Delete(Passenger passenger)
    {
        _context
            .Passengers
            .Remove(passenger);
    }

    public async Task<Passenger?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context
            .Passengers
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IReadOnlyCollection<Passenger>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context
            .Passengers
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync(ct);
    }

    public async Task<Passenger?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Passengers
            .Include(p => p.Bookings)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }
    public async Task<IReadOnlyCollection<PassengerWithDocumentsDto>> GetPassengersWithDocumentsByUserId(Guid userId,
        CancellationToken ct = default)
    {
        return await _context
            .Passengers
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new PassengerWithDocumentsDto
            {
                Id = p.Id,
                Type = p.Type,
                Documents = p.Documents.Select(d => new DocumentDto
                {
                    Id = d.Id,
                    DateOfBirth = d.DateOfBirth,
                    Gender = d.Gender,
                    FirstName = d.FirstName,
                    LastName = d.LastName,
                    MiddleName = d.MiddleName,
                    Type = d.Type, 
                    ValidityPeriod = d.ValidityPeriod
                }).ToList()
            })
            .ToListAsync(ct);
    }
}
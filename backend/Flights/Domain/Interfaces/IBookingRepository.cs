using Flights.Domain.Dto;
using Flights.Domain.Models;

namespace Flights.Domain.Interfaces;

public interface IBookingRepository
{
    Task AddAsync(Booking booking, CancellationToken ct = default);
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyCollection<BookingDto>> GetAllByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Booking?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
}
using Flights.Domain.Dto;
using Flights.Domain.Models;

namespace Flights.Domain.Interfaces;

public interface IPassengerRepository
{
    Task AddAsync(Passenger passenger, CancellationToken ct = default);
    void Update(Passenger passenger);
    void Delete(Passenger passenger);
    Task<IReadOnlyCollection<Passenger>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Passenger?> GetByIdAsync(Guid passengerId, CancellationToken ct = default);
    Task<IReadOnlyCollection<PassengerWithDocumentsDto>> GetPassengersWithDocumentsByUserId(Guid userId,
        CancellationToken ct = default);

    Task<Passenger?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
}
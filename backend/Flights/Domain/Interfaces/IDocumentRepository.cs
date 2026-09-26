using Flights.Domain.Dto;
using Flights.Domain.Models;

namespace Flights.Domain.Interfaces;

public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Document document, CancellationToken ct = default);
    void Delete(Document document);
    void Update(Document document);
    Task<IReadOnlyCollection<DocumentsByUserDto>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
}
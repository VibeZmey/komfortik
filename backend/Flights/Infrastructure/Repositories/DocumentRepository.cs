using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly FlightsDbContext _context;

    public DocumentRepository(FlightsDbContext context)
    {
        _context = context;
    }
    
    public async Task AddAsync(Document document, CancellationToken ct = default)
    {
        await _context.Documents.AddAsync(document, ct);
    }

    public void Delete(Document document)
    {
        _context.Documents.Remove(document);
    }

    public async Task<Document?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id, ct);
    }

    public void Update(Document document)
    {
        var doc = _context
            .Documents
            .Local
            .FirstOrDefault(d => d.Id == document.Id);

        if (doc is not null)
            _context.Entry(doc).CurrentValues.SetValues(document);
        else
            _context.Documents.Update(document);
    }

    public async Task<IReadOnlyCollection<DocumentsByUserDto>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.Documents
            .Where(d => d.UserId == userId)
            .Select(d => new DocumentsByUserDto
            {
                Id = d.Id,
                Type = d.Type,
                FirstName = d.FirstName,
                LastName = d.LastName,
                MiddleName = d.MiddleName,
                Gender = d.Gender,
                DateOfBirth = d.DateOfBirth,
                PassengerId = d.PassengerId,
                ValidityPeriod = d.ValidityPeriod
            })
            .ToListAsync(ct);
    }
}